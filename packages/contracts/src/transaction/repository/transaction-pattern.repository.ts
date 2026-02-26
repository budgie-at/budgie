/* eslint-disable max-lines -- Two-path monthly detection (bank-synced + manual) with correlated subqueries */
import { SQL, and, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, sql } from 'drizzle-orm';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { getDirectExchangeRateSql, getInverseExchangeRateSql } from '../../@generic/util/get-exchange-rate-sql.util';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { AmountPatternQueryInterface } from '../interface/amount-pattern-query.interface';
import { MonthlyPatternQueryInterface } from '../interface/monthly-pattern-query.interface';
import { MonthlyPatternRawRowInterface } from '../interface/monthly-pattern-raw-row.interface';
import { PatternRowInterface } from '../interface/pattern-row.interface';
import { RepeatedTransactionPatternInterface } from '../interface/repeated-transaction-pattern.interface';
import { TransactionPatternQueryInterface } from '../interface/transaction-pattern-query.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';
import { isValidPatternRow } from '../type-guard/is-valid-pattern-row.type-guard';

const DEFAULT_LIMIT = 10;
const MIN_OCCURRENCES = 2;
const MIN_MONTHLY_OCCURRENCES = 3;
const RECENCY_MONTHS = 12;
const DEFAULT_MONTHLY_LIMIT = 50;
const DAY_CONCENTRATION_NUMERATOR = 4;
const DAY_CONCENTRATION_DENOMINATOR = 10;
const AMOUNT_VARIANCE_MULTIPLIER = 2;

const TRANSACTION_ENTRY_JOIN_CONDITION = eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id);
const ACCOUNT_JOIN_CONDITION = eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id);
const CATEGORY_JOIN_CONDITION = eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id);
const MCC_CATEGORY_JOIN_CONDITION = eq(TransactionEntryEntityTable.mccCategoryId, MccCategoryEntityTable.id);

export class TransactionPatternRepository {
    constructor(private db: DB) {}

    private get latestAmountSubquery() {
        return sql<number>`(
            SELECT te2.amount
            FROM transactions t2
            INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
            WHERE te2.category_id = ${TransactionEntryEntityTable.categoryId}
              AND t2.title = ${TransactionEntityTable.title}
              AND t2.deleted_at IS NULL
            ORDER BY t2.operated_at DESC
            LIMIT 1
        )`.as('latestAmount');
    }

    async findRepeatedPatterns(query: TransactionPatternQueryInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const conditions = this.buildPatternConditions(query);
        const patternRows = await this.executePatternQuery(conditions, query.limit ?? DEFAULT_LIMIT);

        return this.enrichPatternsWithTags(patternRows);
    }

    async findMonthlyRecurringPatterns(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const bankPatterns = await this.executeBankSyncedMonthlyQuery(query);
        const manualPatterns = await this.executeManualMonthlyQuery(query);
        const allPatterns = [...bankPatterns, ...manualPatterns];

        allPatterns.sort((first, second) => {
            const occurrenceDiff = second.occurrenceCount - first.occurrenceCount;
            if (occurrenceDiff !== 0) {
                return occurrenceDiff;
            }

            return second.lastOccurrence - first.lastOccurrence;
        });

        return allPatterns.slice(0, query.limit ?? DEFAULT_MONTHLY_LIMIT);
    }

    async findAmountBasedPatterns(query: AmountPatternQueryInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const conditions = this.buildAmountPatternConditions(query);
        const patternRows = await this.executePatternQuery(conditions, query.limit ?? DEFAULT_LIMIT);

        return this.enrichPatternsWithTags(patternRows);
    }

    private buildPatternConditions(query: TransactionPatternQueryInterface): SQL[] {
        const weekdayCondition = sql`CAST(strftime('%w', ${TransactionEntityTable.operatedAt}, 'unixepoch') AS INTEGER) = ${query.weekday}`;
        const timeCondition = sql`
            CAST(strftime('%H', ${TransactionEntityTable.operatedAt}, 'unixepoch') AS INTEGER) * 60 +
            CAST(strftime('%M', ${TransactionEntityTable.operatedAt}, 'unixepoch') AS INTEGER)
            BETWEEN ${query.timeWindowStartMinutes} AND ${query.timeWindowEndMinutes}
        `;

        const conditions = this.buildBasePatternConditions(query);
        conditions.push(weekdayCondition, timeCondition, sql`${TransactionEntityTable.title} != ''`);

        return conditions;
    }

    private buildAmountPatternConditions(query: AmountPatternQueryInterface): SQL[] {
        const conditions = this.buildBasePatternConditions(query);
        conditions.push(
            gte(TransactionEntryEntityTable.amount, query.amountMin),
            lte(TransactionEntryEntityTable.amount, query.amountMax),
            sql`${TransactionEntityTable.title} != ''`
        );

        return conditions;
    }

    private buildBasePatternConditions(query: { type: TransactionTypeEnum; accountId?: number; categoryId?: number }): SQL[] {
        const entryType = this.getEntryTypeForTransactionType(query.type);

        const conditions: SQL[] = [
            eq(TransactionEntityTable.type, query.type),
            isNull(TransactionEntityTable.deletedAt),
            eq(TransactionEntryEntityTable.type, entryType),
            ne(AccountEntityTable.type, AccountTypeEnum.DEBT),
            isNotNull(TransactionEntryEntityTable.categoryId)
        ];

        if (isPositiveNumber(query.accountId)) {
            conditions.push(eq(TransactionEntryEntityTable.accountId, query.accountId));
        }

        if (isPositiveNumber(query.categoryId)) {
            conditions.push(eq(TransactionEntryEntityTable.categoryId, query.categoryId));
        }

        return conditions;
    }

    private async executePatternQuery(conditions: SQL[], limit: number): Promise<PatternRowInterface[]> {
        return this.db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitle: CategoryEntityTable.title,
                categoryIcon: CategoryEntityTable.icon,
                title: TransactionEntityTable.title,
                comment: sql<string | null>`MAX(${TransactionEntityTable.comment})`.as('comment'),
                latestAmount: this.latestAmountSubquery,
                occurrenceCount: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})`.as('occurrenceCount'),
                lastOccurrence: sql<number>`MAX(${TransactionEntityTable.operatedAt})`.as('lastOccurrence'),
                accountId: AccountEntityTable.id,
                instrumentId: AccountEntityTable.instrumentId,
                accountIsActive: AccountEntityTable.isActive,
                accountDeletedAt: sql<number | null>`${AccountEntityTable.deletedAt}`.as('accountDeletedAt')
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, TRANSACTION_ENTRY_JOIN_CONDITION)
            .innerJoin(AccountEntityTable, ACCOUNT_JOIN_CONDITION)
            .leftJoin(CategoryEntityTable, CATEGORY_JOIN_CONDITION)
            .where(and(...conditions))
            .groupBy(TransactionEntryEntityTable.categoryId, TransactionEntityTable.title)
            .having(sql`COUNT(DISTINCT ${TransactionEntityTable.id}) >= ${MIN_OCCURRENCES}`)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`), desc(sql`COUNT(DISTINCT ${TransactionEntityTable.id})`))
            .limit(limit);
    }

    private async enrichPatternsWithTags(patternRows: PatternRowInterface[]): Promise<RepeatedTransactionPatternInterface[]> {
        if (!isNotEmptyArray(patternRows)) {
            return [];
        }
        const validRows = patternRows.filter(isValidPatternRow);
        const tagMap = await this.findTagsForPatterns(validRows);

        return validRows.map(row => ({
            ...row,
            tagIds: tagMap.get(`${row.categoryId}-${row.title}`) ?? [],
            lastOccurrence: new Date(row.lastOccurrence * 1000),
            accountDeletedAt: row.accountDeletedAt === null ? null : new Date(row.accountDeletedAt * 1000)
        }));
    }

    // eslint-disable-next-line max-statements -- Batched tag query replacing N+1 pattern
    private async findTagsForPatterns(patterns: { categoryId: number; title: string }[]): Promise<Map<string, number[]>> {
        const tagMap = new Map<string, number[]>();
        if (!isNotEmptyArray(patterns)) {
            return tagMap;
        }

        const titles = [...new Set(patterns.map(pattern => pattern.title))];
        const categoryIds = [...new Set(patterns.map(pattern => pattern.categoryId))];

        const tagRows = await this.db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                title: TransactionEntityTable.title,
                tagId: TransactionTagsEntityTable.tagId,
                tagCount: sql<number>`COUNT(${TransactionTagsEntityTable.tagId})`.as('tagCount')
            })
            .from(TransactionTagsEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(
                and(
                    inArray(TransactionEntryEntityTable.categoryId, categoryIds),
                    inArray(TransactionEntityTable.title, titles),
                    isNull(TransactionEntityTable.deletedAt)
                )
            )
            .groupBy(TransactionEntryEntityTable.categoryId, TransactionEntityTable.title, TransactionTagsEntityTable.tagId)
            .orderBy(
                TransactionEntryEntityTable.categoryId,
                TransactionEntityTable.title,
                desc(sql`COUNT(${TransactionTagsEntityTable.tagId})`)
            );

        const patternKeys = new Set(patterns.map(pattern => `${pattern.categoryId}-${pattern.title}`));
        const maxTagsPerPattern = 5;

        for (const row of tagRows) {
            const key = `${row.categoryId}-${row.title}`;
            const existing = tagMap.get(key) ?? [];

            if (patternKeys.has(key) && existing.length < maxTagsPerPattern) {
                existing.push(row.tagId);
                tagMap.set(key, existing);
            }
        }

        return tagMap;
    }

    private getEntryTypeForTransactionType(type: TransactionTypeEnum): TransactionEntryTypeEnum {
        return type === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
    }

    private buildMonthlyBaseConditions(query: MonthlyPatternQueryInterface): {
        conditions: SQL[];
        entryType: TransactionEntryTypeEnum;
        recencyTimestamp: number;
    } {
        const entryType = this.getEntryTypeForTransactionType(query.type);
        const recencyTimestamp = Math.floor(Date.now() / 1000) - RECENCY_MONTHS * 30 * 24 * 60 * 60;

        const conditions: SQL[] = [
            eq(TransactionEntityTable.type, query.type),
            isNull(TransactionEntityTable.deletedAt),
            eq(TransactionEntryEntityTable.type, entryType),
            ne(AccountEntityTable.type, AccountTypeEnum.DEBT),
            sql`${TransactionEntityTable.operatedAt} >= ${recencyTimestamp}`
        ];

        return { conditions, entryType, recencyTimestamp };
    }

    private getExchangeRateSql(defaultInstrumentId: number): SQL {
        return sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, AccountEntityTable.instrumentId)},
            ${getInverseExchangeRateSql(defaultInstrumentId, AccountEntityTable.instrumentId)},
            1.0)`;
    }

    private buildMonthlyHavingConditions(distinctMonth: SQL, modeDayCount: SQL<number>): SQL | undefined {
        return and(
            sql`COUNT(DISTINCT ${distinctMonth}) >= ${MIN_MONTHLY_OCCURRENCES}`,
            sql`MAX(${TransactionEntryEntityTable.amount}) <= MIN(${TransactionEntryEntityTable.amount}) * ${AMOUNT_VARIANCE_MULTIPLIER}`,
            sql`${modeDayCount} * ${DAY_CONCENTRATION_DENOMINATOR} >= COUNT(DISTINCT ${TransactionEntityTable.id}) * ${DAY_CONCENTRATION_NUMERATOR}`
        );
    }

    private buildCommonMonthlySelectFields(params: {
        displayMonthTransaction: SQL;
        distinctMonth: SQL;
        timezoneOffset: number;
        latestOverallTransaction: SQL;
    }): {
        categoryId: typeof TransactionEntryEntityTable.categoryId;
        categoryTitle: typeof CategoryEntityTable.title;
        categoryIcon: typeof CategoryEntityTable.icon;
        latestTransactionId: SQL.Aliased<number>;
        occurrenceCount: SQL.Aliased<number>;
        lastOccurrence: SQL.Aliased<number>;
        dayOfMonth: SQL.Aliased<number>;
        latestOverallTransactionId: SQL.Aliased<number>;
        accountId: typeof AccountEntityTable.id;
        instrumentId: typeof AccountEntityTable.instrumentId;
    } {
        return {
            categoryId: TransactionEntryEntityTable.categoryId,
            categoryTitle: CategoryEntityTable.title,
            categoryIcon: CategoryEntityTable.icon,
            latestTransactionId: sql<number>`${params.displayMonthTransaction}`.as('latestTransactionId'),
            occurrenceCount: sql<number>`COUNT(DISTINCT ${params.distinctMonth})`.as('occurrenceCount'),
            lastOccurrence: sql<number>`MAX(${TransactionEntityTable.operatedAt})`.as('lastOccurrence'),
            dayOfMonth: sql<number>`(SELECT CAST(strftime('%d', t3.operated_at + ${params.timezoneOffset}, 'unixepoch') AS INTEGER)
                FROM transactions t3 WHERE t3.id = ${params.displayMonthTransaction})`.as('dayOfMonth'),
            latestOverallTransactionId: sql<number>`${params.latestOverallTransaction}`.as('latestOverallTransactionId'),
            accountId: AccountEntityTable.id,
            instrumentId: AccountEntityTable.instrumentId
        };
    }

    private async executeBankSyncedMonthlyQuery(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const { conditions, entryType, recencyTimestamp } = this.buildMonthlyBaseConditions(query);
        conditions.push(sql`${TransactionEntityTable.title} != ''`);

        const timezoneOffset = query.timezoneOffsetSeconds;
        const exchangeRate = this.getExchangeRateSql(query.defaultInstrumentId);
        const distinctMonth = sql`strftime('%Y-%m', ${TransactionEntityTable.operatedAt} + ${timezoneOffset}, 'unixepoch')`;

        const bankMatchCondition = sql`t2.title = ${TransactionEntityTable.title} AND te2.account_id = ${AccountEntityTable.id}
            AND t2.deleted_at IS NULL AND t2.type = ${query.type} AND te2.type = ${entryType}`;

        const displayMonthTransaction = sql`(SELECT t2.id FROM transactions t2
            INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
            WHERE ${bankMatchCondition}
            AND strftime('%Y-%m', t2.operated_at + ${timezoneOffset}, 'unixepoch') = ${query.displayMonth}
            ORDER BY t2.operated_at DESC LIMIT 1)`;

        const latestAmount = sql<number>`(SELECT te2.amount FROM transactions t2
            INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
            WHERE ${bankMatchCondition}
            ORDER BY t2.operated_at DESC LIMIT 1) * ${exchangeRate}`.as('latestAmount');

        const modeDayOfMonth = sql<number>`(SELECT CAST(strftime('%d', t5.operated_at + ${timezoneOffset}, 'unixepoch') AS INTEGER)
            FROM transactions t5 INNER JOIN transaction_entries te5 ON te5.transaction_id = t5.id
            WHERE t5.title = ${TransactionEntityTable.title} AND te5.account_id = ${AccountEntityTable.id}
            AND t5.deleted_at IS NULL AND t5.type = ${query.type} AND te5.type = ${entryType} AND t5.operated_at >= ${recencyTimestamp}
            GROUP BY CAST(strftime('%d', t5.operated_at + ${timezoneOffset}, 'unixepoch') AS INTEGER)
            ORDER BY COUNT(DISTINCT t5.id) DESC LIMIT 1)`.as('modeDayOfMonth');

        const modeDayCount = sql<number>`(SELECT MAX(dc) FROM (SELECT COUNT(DISTINCT t4.id) AS dc
            FROM transactions t4 INNER JOIN transaction_entries te4 ON te4.transaction_id = t4.id
            WHERE t4.title = ${TransactionEntityTable.title} AND te4.account_id = ${AccountEntityTable.id}
            AND t4.deleted_at IS NULL AND t4.type = ${query.type} AND te4.type = ${entryType} AND t4.operated_at >= ${recencyTimestamp}
            GROUP BY CAST(strftime('%d', t4.operated_at + ${timezoneOffset}, 'unixepoch') AS INTEGER)))`;

        const latestOverallTransaction = sql`(SELECT t6.id FROM transactions t6
            INNER JOIN transaction_entries te6 ON te6.transaction_id = t6.id
            WHERE t6.title = ${TransactionEntityTable.title} AND te6.account_id = ${AccountEntityTable.id}
            AND t6.deleted_at IS NULL AND t6.type = ${query.type} AND te6.type = ${entryType}
            ORDER BY t6.operated_at DESC LIMIT 1)`;

        return this.db
            .select({
                ...this.buildCommonMonthlySelectFields({
                    displayMonthTransaction,
                    distinctMonth,
                    timezoneOffset,
                    latestOverallTransaction
                }),
                mccCategoryTitle: MccCategoryEntityTable.shortDescription,
                title: sql<string>`(SELECT t2.title FROM transactions t2 WHERE t2.id = ${displayMonthTransaction})`.as('title'),
                latestAmount,
                modeDayOfMonth,
                latestOverallTitle: sql<string>`(SELECT t7.title FROM transactions t7 WHERE t7.id = ${latestOverallTransaction})`.as(
                    'latestOverallTitle'
                )
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, TRANSACTION_ENTRY_JOIN_CONDITION)
            .innerJoin(AccountEntityTable, ACCOUNT_JOIN_CONDITION)
            .leftJoin(CategoryEntityTable, CATEGORY_JOIN_CONDITION)
            .leftJoin(MccCategoryEntityTable, MCC_CATEGORY_JOIN_CONDITION)
            .where(and(...conditions))
            .groupBy(TransactionEntityTable.title, AccountEntityTable.id)
            .having(this.buildMonthlyHavingConditions(distinctMonth, modeDayCount))
            .orderBy(desc(sql`COUNT(DISTINCT ${distinctMonth})`), desc(sql`MAX(${TransactionEntityTable.operatedAt})`));
    }

    private async executeManualMonthlyQuery(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const { conditions, entryType, recencyTimestamp } = this.buildMonthlyBaseConditions(query);
        conditions.push(
            sql`${TransactionEntityTable.title} = ''`,
            sql`${TransactionEntityTable.comment} != ''`,
            isNotNull(TransactionEntryEntityTable.categoryId)
        );

        const timezoneOffset = query.timezoneOffsetSeconds;
        const exchangeRate = this.getExchangeRateSql(query.defaultInstrumentId);
        const distinctMonth = sql`strftime('%Y-%m', ${TransactionEntityTable.operatedAt} + ${timezoneOffset}, 'unixepoch')`;

        const manualMatchCondition = sql`t2.comment = ${TransactionEntityTable.comment}
            AND te2.category_id = ${TransactionEntryEntityTable.categoryId} AND te2.account_id = ${AccountEntityTable.id}
            AND t2.title = '' AND t2.deleted_at IS NULL AND t2.type = ${query.type} AND te2.type = ${entryType}`;

        const displayMonthTransaction = sql`(SELECT t2.id FROM transactions t2
            INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
            WHERE ${manualMatchCondition}
            AND strftime('%Y-%m', t2.operated_at + ${timezoneOffset}, 'unixepoch') = ${query.displayMonth}
            ORDER BY t2.operated_at DESC LIMIT 1)`;

        const latestAmount = sql<number>`(SELECT te2.amount FROM transactions t2
            INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
            WHERE ${manualMatchCondition}
            ORDER BY t2.operated_at DESC LIMIT 1) * ${exchangeRate}`.as('latestAmount');

        const modeDayOfMonth = sql<number>`(SELECT CAST(strftime('%d', t5.operated_at + ${timezoneOffset}, 'unixepoch') AS INTEGER)
            FROM transactions t5 INNER JOIN transaction_entries te5 ON te5.transaction_id = t5.id
            WHERE t5.comment = ${TransactionEntityTable.comment}
            AND te5.category_id = ${TransactionEntryEntityTable.categoryId} AND te5.account_id = ${AccountEntityTable.id}
            AND t5.title = '' AND t5.deleted_at IS NULL AND t5.type = ${query.type} AND te5.type = ${entryType} AND t5.operated_at >= ${recencyTimestamp}
            GROUP BY CAST(strftime('%d', t5.operated_at + ${timezoneOffset}, 'unixepoch') AS INTEGER)
            ORDER BY COUNT(DISTINCT t5.id) DESC LIMIT 1)`.as('modeDayOfMonth');

        const modeDayCount = sql<number>`(SELECT MAX(dc) FROM (SELECT COUNT(DISTINCT t4.id) AS dc
            FROM transactions t4 INNER JOIN transaction_entries te4 ON te4.transaction_id = t4.id
            WHERE t4.comment = ${TransactionEntityTable.comment}
            AND te4.category_id = ${TransactionEntryEntityTable.categoryId} AND te4.account_id = ${AccountEntityTable.id}
            AND t4.title = '' AND t4.deleted_at IS NULL AND t4.type = ${query.type} AND te4.type = ${entryType} AND t4.operated_at >= ${recencyTimestamp}
            GROUP BY CAST(strftime('%d', t4.operated_at + ${timezoneOffset}, 'unixepoch') AS INTEGER)))`;

        const latestOverallTransaction = sql`(SELECT t6.id FROM transactions t6
            INNER JOIN transaction_entries te6 ON te6.transaction_id = t6.id
            WHERE t6.comment = ${TransactionEntityTable.comment}
            AND te6.category_id = ${TransactionEntryEntityTable.categoryId} AND te6.account_id = ${AccountEntityTable.id}
            AND t6.title = '' AND t6.deleted_at IS NULL AND t6.type = ${query.type} AND te6.type = ${entryType}
            ORDER BY t6.operated_at DESC LIMIT 1)`;

        return this.db
            .select({
                ...this.buildCommonMonthlySelectFields({
                    displayMonthTransaction,
                    distinctMonth,
                    timezoneOffset,
                    latestOverallTransaction
                }),
                mccCategoryTitle: sql<null>`NULL`.as('mccCategoryTitle'),
                title: sql<string>`${TransactionEntityTable.comment}`.as('title'),
                latestAmount,
                modeDayOfMonth,
                latestOverallTitle: sql<string>`${TransactionEntityTable.comment}`.as('latestOverallTitle')
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, TRANSACTION_ENTRY_JOIN_CONDITION)
            .innerJoin(AccountEntityTable, ACCOUNT_JOIN_CONDITION)
            .leftJoin(CategoryEntityTable, CATEGORY_JOIN_CONDITION)
            .where(and(...conditions))
            .groupBy(TransactionEntityTable.comment, TransactionEntryEntityTable.categoryId, AccountEntityTable.id)
            .having(this.buildMonthlyHavingConditions(distinctMonth, modeDayCount))
            .orderBy(desc(sql`COUNT(DISTINCT ${distinctMonth})`), desc(sql`MAX(${TransactionEntityTable.operatedAt})`));
    }
}
