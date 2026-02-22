import { SQL, and, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { getDirectExchangeRateSql, getInverseExchangeRateSql } from '../../@generic/util/get-exchange-rate-sql.util';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { AmountPatternQueryInterface } from '../interface/amount-pattern-query.interface';
import { MonthlyPatternQueryInterface } from '../interface/monthly-pattern-query.interface';
import { MonthlyPatternRawRowInterface } from '../interface/monthly-pattern-raw-row.interface';
import { MonthlyPatternRowInterface } from '../interface/monthly-pattern-row.interface';
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

const TRANSACTION_ENTRY_JOIN_CONDITION = eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id);
const ACCOUNT_JOIN_CONDITION = eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id);
const CATEGORY_JOIN_CONDITION = eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id);

export class TransactionPatternRepository {
    constructor(private db: DB) {}

    private get distinctMonthCountExpression() {
        return sql`strftime('%Y-%m', ${TransactionEntityTable.operatedAt}, 'unixepoch')`;
    }

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

    private get modeDayOfMonthSubquery() {
        return sql<number>`(
            SELECT CAST(strftime('%d', t3.operated_at, 'unixepoch') AS INTEGER)
            FROM transactions t3
            INNER JOIN transaction_entries te3 ON te3.transaction_id = t3.id
            WHERE te3.category_id = ${TransactionEntryEntityTable.categoryId}
              AND t3.title = ${TransactionEntityTable.title}
              AND t3.deleted_at IS NULL
            GROUP BY CAST(strftime('%d', t3.operated_at, 'unixepoch') AS INTEGER)
            ORDER BY COUNT(*) DESC
            LIMIT 1
        )`.as('dayOfMonth');
    }

    async findRepeatedPatterns(query: TransactionPatternQueryInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const conditions = this.buildPatternConditions(query);
        const patternRows = await this.executePatternQuery(conditions, query.limit ?? DEFAULT_LIMIT);

        return this.enrichPatternsWithTags(patternRows);
    }

    async findMonthlyRecurringPatterns(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRowInterface[]> {
        const rows = await this.executeMonthlyPatternQuery(query);

        return rows.filter(
            (row): row is MonthlyPatternRowInterface =>
                isDefined(row.categoryId) && isDefined(row.categoryTitle) && isDefined(row.categoryIcon)
        );
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
        conditions.push(weekdayCondition, timeCondition);

        return conditions;
    }

    private buildAmountPatternConditions(query: AmountPatternQueryInterface): SQL[] {
        const conditions = this.buildBasePatternConditions(query);
        conditions.push(gte(TransactionEntryEntityTable.amount, query.amountMin), lte(TransactionEntryEntityTable.amount, query.amountMax));

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
            categoryId: row.categoryId,
            categoryTitle: row.categoryTitle,
            categoryIcon: row.categoryIcon,
            tagIds: tagMap.get(`${row.categoryId}-${row.title}`) ?? [],
            title: row.title,
            comment: row.comment,
            latestAmount: row.latestAmount,
            occurrenceCount: row.occurrenceCount,
            lastOccurrence: new Date(row.lastOccurrence * 1000),
            accountId: row.accountId,
            instrumentId: row.instrumentId,
            accountIsActive: row.accountIsActive,
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

    private getConvertedLatestAmountSubquery(defaultInstrumentId: number) {
        const exchangeRate = sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, AccountEntityTable.instrumentId)},
            ${getInverseExchangeRateSql(defaultInstrumentId, AccountEntityTable.instrumentId)},
            1.0
        )`;

        return sql<number>`(
            SELECT te2.amount
            FROM transactions t2
            INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
            WHERE te2.category_id = ${TransactionEntryEntityTable.categoryId}
              AND t2.title = ${TransactionEntityTable.title}
              AND t2.deleted_at IS NULL
            ORDER BY t2.operated_at DESC
            LIMIT 1
        ) * ${exchangeRate}`.as('latestAmount');
    }

    private async executeMonthlyPatternQuery(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const monthlyConditions = this.buildBasePatternConditions(query);
        monthlyConditions.push(
            sql`${TransactionEntityTable.operatedAt} >= ${Math.floor(Date.now() / 1000) - RECENCY_MONTHS * 30 * 24 * 60 * 60}`
        );
        const distinctMonthCount = this.distinctMonthCountExpression;

        return this.db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitle: CategoryEntityTable.title,
                categoryIcon: CategoryEntityTable.icon,
                title: TransactionEntityTable.title,
                latestAmount: this.getConvertedLatestAmountSubquery(query.defaultInstrumentId),
                occurrenceCount: sql<number>`COUNT(DISTINCT ${distinctMonthCount})`.as('occurrenceCount'),
                lastOccurrence: sql<number>`MAX(${TransactionEntityTable.operatedAt})`.as('lastOccurrence'),
                dayOfMonth: this.modeDayOfMonthSubquery,
                accountId: AccountEntityTable.id,
                instrumentId: AccountEntityTable.instrumentId
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, TRANSACTION_ENTRY_JOIN_CONDITION)
            .innerJoin(AccountEntityTable, ACCOUNT_JOIN_CONDITION)
            .leftJoin(CategoryEntityTable, CATEGORY_JOIN_CONDITION)
            .where(and(...monthlyConditions))
            .groupBy(TransactionEntryEntityTable.categoryId, TransactionEntityTable.title)
            .having(sql`COUNT(DISTINCT ${distinctMonthCount}) >= ${MIN_MONTHLY_OCCURRENCES}`)
            .orderBy(desc(sql`COUNT(DISTINCT ${distinctMonthCount})`), desc(sql`MAX(${TransactionEntityTable.operatedAt})`))
            .limit(query.limit ?? DEFAULT_MONTHLY_LIMIT);
    }
}
