/* eslint-disable max-lines -- Two-path monthly detection (bank-synced + manual) with window-function CTEs */
import { Log } from '@budgie/logger';
import { SQL, and, between, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import {
    PATTERN_ALL_TIME_CTE,
    PATTERN_DAY_AGG_CTE,
    PATTERN_FILTERED_CTE,
    PATTERN_GROUPS_CTE,
    PATTERN_LATEST_DISPLAY_CTE,
    PATTERN_LATEST_OVERALL_CTE,
    PATTERN_MODE_DAY_CTE,
    PATTERN_OVERALL_AGG_CTE
} from '../constant/transaction-pattern-ctes.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';
import { isValidPatternRow } from '../type-guard/is-valid-pattern-row.type-guard';

import type { AmountPatternQueryInterface } from '../interface/amount-pattern-query.interface';
import type { MonthlyPatternQueryInterface } from '../interface/monthly-pattern-query.interface';
import type { MonthlyPatternRawRowInterface } from '../interface/monthly-pattern-raw-row.interface';
import type { PatternRowInterface } from '../interface/pattern-row.interface';
import type { RepeatedTransactionPatternInterface } from '../interface/repeated-transaction-pattern.interface';
import type { TransactionPatternQueryInterface } from '../interface/transaction-pattern-query.interface';

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

type PatternGroupColumn = 'title' | 'comment';

const PATTERN_GROUP_COLUMNS: PatternGroupColumn[] = ['title', 'comment'];

export class TransactionPatternRepository {
    constructor(private db: DB) {}

    @Log(
        query =>
            `enter type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} weekday=${query.weekday} window=${query.timeWindowStartMinutes}-${query.timeWindowEndMinutes}`,
        (result, query) =>
            `done type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} weekday=${query.weekday} window=${query.timeWindowStartMinutes}-${query.timeWindowEndMinutes} categoryIds=${result.map(pattern => pattern.categoryId).join(',')} titles=${result.map(pattern => pattern.title).join('|')}`,
        (error, query) =>
            `throw type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} weekday=${query.weekday} window=${query.timeWindowStartMinutes}-${query.timeWindowEndMinutes} error=${getErrorMessage(error)}`
    )
    async findRepeatedPatterns(query: TransactionPatternQueryInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const limit = query.limit ?? DEFAULT_LIMIT;
        const pathResults = await Promise.all(
            PATTERN_GROUP_COLUMNS.map(async groupColumn => {
                const conditions = this.buildPatternConditions(query, groupColumn);
                const patternRows = await this.executePatternQuery(conditions, limit, groupColumn);

                return this.enrichPatternsWithTags(patternRows, groupColumn);
            })
        );

        return this.mergePatternResults(pathResults, limit);
    }

    @Log(
        query =>
            `enter type=${query.type} defaultInstrumentId=${query.defaultInstrumentId} displayMonth=${query.displayMonth} tzOffset=${query.timezoneOffsetSeconds}`,
        (result, query) =>
            `done type=${query.type} displayMonth=${query.displayMonth} titles=${result.map(pattern => pattern.title).join('|')} accountIds=${result.map(pattern => pattern.accountId).join(',')}`,
        (error, query) => `throw type=${query.type} displayMonth=${query.displayMonth} error=${getErrorMessage(error)}`
    )
    async findMonthlyRecurringPatterns(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const [bankPatterns, manualPatterns] = await Promise.all([
            this.executeBankSyncedMonthlyQuery(query),
            this.executeManualMonthlyQuery(query)
        ]);

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

    @Log(
        query =>
            `enter type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} amountMin=${query.amountMin} amountMax=${query.amountMax}`,
        (result, query) =>
            `done type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} amountMin=${query.amountMin} amountMax=${query.amountMax} categoryIds=${result.map(pattern => pattern.categoryId).join(',')} titles=${result.map(pattern => pattern.title).join('|')}`,
        (error, query) =>
            `throw type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} amountMin=${query.amountMin} amountMax=${query.amountMax} error=${getErrorMessage(error)}`
    )
    async findAmountBasedPatterns(query: AmountPatternQueryInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const limit = query.limit ?? DEFAULT_LIMIT;
        const pathResults = await Promise.all(
            PATTERN_GROUP_COLUMNS.map(async groupColumn => {
                const conditions = this.buildAmountPatternConditions(query, groupColumn);
                const patternRows = await this.executePatternQuery(conditions, limit, groupColumn);

                return this.enrichPatternsWithTags(patternRows, groupColumn);
            })
        );

        return this.mergePatternResults(pathResults, limit);
    }

    private buildLatestAmountSubquery(groupColumn: PatternGroupColumn) {
        if (groupColumn === 'title') {
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

        return sql<number>`(
            SELECT te2.amount
            FROM transactions t2
            INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
            WHERE te2.category_id = ${TransactionEntryEntityTable.categoryId}
              AND t2.comment = ${TransactionEntityTable.comment}
              AND t2.title = ''
              AND t2.deleted_at IS NULL
            ORDER BY t2.operated_at DESC
            LIMIT 1
        )`.as('latestAmount');
    }

    private mergePatternResults(
        pathResults: RepeatedTransactionPatternInterface[][],
        limit: number
    ): RepeatedTransactionPatternInterface[] {
        return pathResults
            .flat()
            .sort(
                (first, second) =>
                    second.lastOccurrence.getTime() - first.lastOccurrence.getTime() || second.occurrenceCount - first.occurrenceCount
            )
            .slice(0, limit);
    }

    private buildPatternConditions(query: TransactionPatternQueryInterface, groupColumn: PatternGroupColumn): SQL[] {
        const weekdayCondition = eq(TransactionEntityTable.operatedWeekday, query.weekday);
        const timeCondition = between(TransactionEntityTable.operatedMinuteOfDay, query.timeWindowStartMinutes, query.timeWindowEndMinutes);

        const conditions = this.buildBasePatternConditions(query, groupColumn);
        conditions.push(weekdayCondition, timeCondition);

        return conditions;
    }

    private buildAmountPatternConditions(query: AmountPatternQueryInterface, groupColumn: PatternGroupColumn): SQL[] {
        const conditions = this.buildBasePatternConditions(query, groupColumn);
        conditions.push(gte(TransactionEntryEntityTable.amount, query.amountMin), lte(TransactionEntryEntityTable.amount, query.amountMax));

        return conditions;
    }

    private buildBasePatternConditions(
        query: { type: TransactionTypeEnum; accountId?: number; categoryId?: number },
        groupColumn: PatternGroupColumn
    ): SQL[] {
        const entryType = this.getEntryTypeForTransactionType(query.type);

        const conditions: SQL[] = [
            eq(TransactionEntityTable.type, query.type),
            isNull(TransactionEntityTable.deletedAt),
            eq(TransactionEntryEntityTable.type, entryType),
            ne(AccountEntityTable.type, AccountTypeEnum.DEBT),
            isNotNull(TransactionEntryEntityTable.categoryId)
        ];

        if (groupColumn === 'title') {
            conditions.push(ne(TransactionEntityTable.title, ''));
        } else {
            conditions.push(eq(TransactionEntityTable.title, ''), ne(TransactionEntityTable.comment, ''));
        }

        if (isPositiveNumber(query.accountId)) {
            conditions.push(eq(TransactionEntryEntityTable.accountId, query.accountId));
        }

        if (isPositiveNumber(query.categoryId)) {
            conditions.push(eq(TransactionEntryEntityTable.categoryId, query.categoryId));
        }

        return conditions;
    }

    private async executePatternQuery(conditions: SQL[], limit: number, groupColumn: PatternGroupColumn): Promise<PatternRowInterface[]> {
        const titleSource = groupColumn === 'title' ? TransactionEntityTable.title : TransactionEntityTable.comment;

        return this.db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitle: CategoryEntityTable.title,
                categoryIcon: CategoryEntityTable.icon,
                title: titleSource,
                comment: sql<string | null>`MAX(${TransactionEntityTable.comment})`.as('comment'),
                latestAmount: this.buildLatestAmountSubquery(groupColumn),
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
            .groupBy(TransactionEntryEntityTable.categoryId, titleSource)
            .having(sql`COUNT(DISTINCT ${TransactionEntityTable.id}) >= ${MIN_OCCURRENCES}`)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`), desc(sql`COUNT(DISTINCT ${TransactionEntityTable.id})`))
            .limit(limit);
    }

    private async enrichPatternsWithTags(
        patternRows: PatternRowInterface[],
        groupColumn: PatternGroupColumn
    ): Promise<RepeatedTransactionPatternInterface[]> {
        if (!isNotEmptyArray(patternRows)) {
            return [];
        }
        const validRows = patternRows.filter(isValidPatternRow);
        const tagMap = await this.findTagsForPatterns(validRows, groupColumn);

        return validRows.map(row => ({
            ...row,
            tagIds: tagMap.get(`${row.categoryId}-${row.title}`) ?? [],
            lastOccurrence: new Date(row.lastOccurrence * 1000),
            accountDeletedAt: isDefined(row.accountDeletedAt) ? new Date(row.accountDeletedAt * 1000) : null
        }));
    }

    // eslint-disable-next-line max-statements -- Batched tag query replacing N+1 pattern
    private async findTagsForPatterns(
        patterns: { categoryId: number; title: string }[],
        groupColumn: PatternGroupColumn
    ): Promise<Map<string, number[]>> {
        const tagMap = new Map<string, number[]>();
        if (!isNotEmptyArray(patterns)) {
            return tagMap;
        }

        const titles = [...new Set(patterns.map(pattern => pattern.title))];
        const categoryIds = [...new Set(patterns.map(pattern => pattern.categoryId))];
        const titleSource = groupColumn === 'title' ? TransactionEntityTable.title : TransactionEntityTable.comment;
        const titleScopeCondition = groupColumn === 'title' ? ne(TransactionEntityTable.title, '') : eq(TransactionEntityTable.title, '');

        const tagRows = await this.db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                title: titleSource,
                tagId: TransactionTagsEntityTable.tagId,
                tagCount: sql<number>`COUNT(${TransactionTagsEntityTable.tagId})`.as('tagCount')
            })
            .from(TransactionTagsEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(
                and(
                    inArray(TransactionEntryEntityTable.categoryId, categoryIds),
                    inArray(titleSource, titles),
                    titleScopeCondition,
                    isNull(TransactionEntityTable.deletedAt)
                )
            )
            .groupBy(TransactionEntryEntityTable.categoryId, titleSource, TransactionTagsEntityTable.tagId)
            .orderBy(TransactionEntryEntityTable.categoryId, titleSource, desc(sql`COUNT(${TransactionTagsEntityTable.tagId})`));

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

    private buildMonthlyQueryContext(query: MonthlyPatternQueryInterface): {
        entryType: TransactionEntryTypeEnum;
        recencyTimestamp: number;
        tzOffset: number;
        type: TransactionTypeEnum;
        defaultInstrumentId: number;
        displayMonth: string;
    } {
        return {
            entryType: this.getEntryTypeForTransactionType(query.type),
            recencyTimestamp: Math.floor(Date.now() / 1000) - RECENCY_MONTHS * 30 * 24 * 60 * 60,
            tzOffset: query.timezoneOffsetSeconds,
            type: query.type,
            defaultInstrumentId: query.defaultInstrumentId,
            displayMonth: query.displayMonth
        };
    }

    private async executeBankSyncedMonthlyQuery(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const { entryType, recencyTimestamp, tzOffset, type, defaultInstrumentId, displayMonth } = this.buildMonthlyQueryContext(query);

        const bankSql = `
WITH groups AS (${PATTERN_GROUPS_CTE}),
     day_agg AS (${PATTERN_DAY_AGG_CTE}),
     mode_day AS (${PATTERN_MODE_DAY_CTE}),
     overall_agg AS (${PATTERN_OVERALL_AGG_CTE}),
     filtered AS (${PATTERN_FILTERED_CTE}),
     all_time AS (${PATTERN_ALL_TIME_CTE}),
     latest_overall AS (${PATTERN_LATEST_OVERALL_CTE}),
     latest_display AS (${PATTERN_LATEST_DISPLAY_CTE})
SELECT lo.title, lo.account_id AS accountId, lo.instrument_id AS instrumentId,
       lo.category_id AS categoryId, lo.cat_title AS categoryTitle, lo.cat_icon AS categoryIcon,
       lo.mcc_short_description AS mccCategoryTitle,
       ld.tx_id AS latestTransactionId,
       lo.amount * COALESCE(
           (SELECT er.rate * 1.0 FROM exchange_rates er
            WHERE er.base_instrument_id = lo.instrument_id AND er.quote_instrument_id = ?
              AND er.deleted_at IS NULL ORDER BY er.created_at DESC LIMIT 1),
           (SELECT 1.0 / er.rate FROM exchange_rates er
            WHERE er.base_instrument_id = ? AND er.quote_instrument_id = lo.instrument_id
              AND er.deleted_at IS NULL ORDER BY er.created_at DESC LIMIT 1),
           1.0
       ) AS latestAmount,
       ld.day_of_month AS dayOfMonth,
       f.mode_day_of_month AS modeDayOfMonth,
       f.occurrence_count AS occurrenceCount,
       f.last_occurrence AS lastOccurrence,
       lo.tx_id AS latestOverallTransactionId,
       lo.title AS latestOverallTitle
FROM filtered f
INNER JOIN latest_overall lo ON lo.title = f.title AND lo.account_id = f.account_id AND lo.rk = 1
LEFT JOIN latest_display ld ON ld.title = f.title AND ld.account_id = f.account_id AND ld.rk = 1
ORDER BY f.occurrence_count DESC, f.last_occurrence DESC`;

        return this.db.$client.getAllAsync<MonthlyPatternRawRowInterface>(bankSql, [
            tzOffset,
            tzOffset,
            type,
            entryType,
            recencyTimestamp,
            MIN_MONTHLY_OCCURRENCES,
            AMOUNT_VARIANCE_MULTIPLIER,
            DAY_CONCENTRATION_DENOMINATOR,
            DAY_CONCENTRATION_NUMERATOR,
            type,
            entryType,
            displayMonth,
            defaultInstrumentId,
            defaultInstrumentId
        ]);
    }

    // eslint-disable-next-line max-lines-per-function -- Raw SQL window-function CTE cannot be split further
    private async executeManualMonthlyQuery(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const { entryType, recencyTimestamp, tzOffset, type, defaultInstrumentId, displayMonth } = this.buildMonthlyQueryContext(query);

        const manualSql = `
WITH groups AS (
    SELECT t.comment, te.category_id, a.id AS account_id, a.instrument_id,
           cat.title AS cat_title, cat.icon AS cat_icon,
           CAST(strftime('%d', t.operated_at + ?, 'unixepoch') AS INTEGER) AS day_of_month,
           strftime('%Y-%m', t.operated_at + ?, 'unixepoch') AS year_month,
           t.id AS tx_id, te.amount, t.operated_at
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    INNER JOIN accounts a ON a.id = te.account_id
    LEFT JOIN categories cat ON cat.id = te.category_id
    WHERE t.type = ? AND te.type = ? AND t.deleted_at IS NULL
      AND a.type != 'DEBT' AND t.operated_at >= ?
      AND t.title = '' AND t.comment != '' AND te.category_id IS NOT NULL
),
day_agg AS (
    SELECT comment, category_id, account_id, instrument_id, day_of_month,
           COUNT(DISTINCT tx_id) AS day_count
    FROM groups
    GROUP BY comment, category_id, account_id, instrument_id, day_of_month
),
mode_day AS (
    SELECT comment, category_id, account_id, instrument_id,
           day_of_month AS mode_day_of_month,
           day_count AS mode_day_count,
           ROW_NUMBER() OVER (PARTITION BY comment, category_id, account_id ORDER BY day_count DESC, day_of_month ASC) AS rk
    FROM day_agg
),
overall_agg AS (
    SELECT comment, category_id, account_id, instrument_id,
           COUNT(DISTINCT year_month) AS occurrence_count,
           COUNT(DISTINCT tx_id) AS total_tx_count,
           MAX(amount) AS max_amount, MIN(amount) AS min_amount,
           MAX(operated_at) AS last_occurrence
    FROM groups
    GROUP BY comment, category_id, account_id, instrument_id
),
filtered AS (
    SELECT oa.comment, oa.category_id, oa.account_id, oa.instrument_id,
           oa.occurrence_count, oa.total_tx_count, oa.max_amount, oa.min_amount, oa.last_occurrence,
           m.mode_day_of_month, m.mode_day_count
    FROM overall_agg oa
    INNER JOIN mode_day m ON m.comment = oa.comment AND m.category_id = oa.category_id
      AND m.account_id = oa.account_id AND m.rk = 1
    WHERE oa.occurrence_count >= ?
      AND oa.max_amount <= oa.min_amount * ?
      AND m.mode_day_count * ? >= oa.total_tx_count * ?
),
all_time AS (
    SELECT t.comment, te.category_id, a.id AS account_id, a.instrument_id,
           cat.title AS cat_title, cat.icon AS cat_icon,
           t.id AS tx_id, te.amount, t.operated_at
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    INNER JOIN accounts a ON a.id = te.account_id
    LEFT JOIN categories cat ON cat.id = te.category_id
    WHERE t.type = ? AND te.type = ? AND t.deleted_at IS NULL
      AND a.type != 'DEBT'
      AND t.title = '' AND t.comment != '' AND te.category_id IS NOT NULL
),
latest_overall AS (
    SELECT at.comment, at.category_id, at.account_id, at.tx_id, at.operated_at, at.amount,
           at.cat_title, at.cat_icon, at.instrument_id,
           ROW_NUMBER() OVER (PARTITION BY at.comment, at.category_id, at.account_id ORDER BY at.operated_at DESC, at.tx_id DESC) AS rk
    FROM all_time at
    INNER JOIN filtered f ON f.comment = at.comment AND f.category_id = at.category_id AND f.account_id = at.account_id
),
latest_display AS (
    SELECT g.comment, g.category_id, g.account_id, g.tx_id, g.day_of_month,
           ROW_NUMBER() OVER (PARTITION BY g.comment, g.category_id, g.account_id ORDER BY g.operated_at DESC, g.tx_id DESC) AS rk
    FROM groups g
    INNER JOIN filtered f ON f.comment = g.comment AND f.category_id = g.category_id AND f.account_id = g.account_id
    WHERE g.year_month = ?
)
SELECT lo.comment AS title, lo.account_id AS accountId, lo.instrument_id AS instrumentId,
       lo.category_id AS categoryId, lo.cat_title AS categoryTitle, lo.cat_icon AS categoryIcon,
       NULL AS mccCategoryTitle,
       ld.tx_id AS latestTransactionId,
       lo.amount * COALESCE(
           (SELECT er.rate * 1.0 FROM exchange_rates er
            WHERE er.base_instrument_id = lo.instrument_id AND er.quote_instrument_id = ?
              AND er.deleted_at IS NULL ORDER BY er.created_at DESC LIMIT 1),
           (SELECT 1.0 / er.rate FROM exchange_rates er
            WHERE er.base_instrument_id = ? AND er.quote_instrument_id = lo.instrument_id
              AND er.deleted_at IS NULL ORDER BY er.created_at DESC LIMIT 1),
           1.0
       ) AS latestAmount,
       ld.day_of_month AS dayOfMonth,
       f.mode_day_of_month AS modeDayOfMonth,
       f.occurrence_count AS occurrenceCount,
       f.last_occurrence AS lastOccurrence,
       lo.tx_id AS latestOverallTransactionId,
       lo.comment AS latestOverallTitle
FROM filtered f
INNER JOIN latest_overall lo ON lo.comment = f.comment AND lo.category_id = f.category_id AND lo.account_id = f.account_id AND lo.rk = 1
LEFT JOIN latest_display ld ON ld.comment = f.comment AND ld.category_id = f.category_id AND ld.account_id = f.account_id AND ld.rk = 1
ORDER BY f.occurrence_count DESC, f.last_occurrence DESC`;

        return this.db.$client.getAllAsync<MonthlyPatternRawRowInterface>(manualSql, [
            tzOffset,
            tzOffset,
            type,
            entryType,
            recencyTimestamp,
            MIN_MONTHLY_OCCURRENCES,
            AMOUNT_VARIANCE_MULTIPLIER,
            DAY_CONCENTRATION_DENOMINATOR,
            DAY_CONCENTRATION_NUMERATOR,
            type,
            entryType,
            displayMonth,
            defaultInstrumentId,
            defaultInstrumentId
        ]);
    }
}
