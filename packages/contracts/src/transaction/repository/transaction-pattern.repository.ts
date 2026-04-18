/* eslint-disable max-lines -- Two-path monthly detection (bank-synced + manual) with window-function CTEs */
import { SQL, and, between, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, sql } from 'drizzle-orm';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { bankSyncLog } from '../../@generic/util/bank-sync-log.util';

import { DB } from '../../@generic/type/db.type';
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
        const start = Date.now();
        bankSyncLog('repo:pattern:findRepeatedPatterns:start', { weekday: query.weekday, accountId: query.accountId, categoryId: query.categoryId });
        const conditions = this.buildPatternConditions(query);
        const patternRows = await this.executePatternQuery(conditions, query.limit ?? DEFAULT_LIMIT);
        const result = await this.enrichPatternsWithTags(patternRows);
        bankSyncLog('repo:pattern:findRepeatedPatterns:done', { resultCount: result.length, durationMs: Date.now() - start });

        return result;
    }

    async findMonthlyRecurringPatterns(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const start = Date.now();
        bankSyncLog('repo:pattern:findMonthlyRecurringPatterns:start', { displayMonth: query.displayMonth, defaultInstrumentId: query.defaultInstrumentId });

        const bankStart = Date.now();
        const bankPatterns = await this.executeBankSyncedMonthlyQuery(query);
        bankSyncLog('repo:pattern:findMonthlyRecurringPatterns:bankSynced', { count: bankPatterns.length, durationMs: Date.now() - bankStart });

        const manualStart = Date.now();
        const manualPatterns = await this.executeManualMonthlyQuery(query);
        bankSyncLog('repo:pattern:findMonthlyRecurringPatterns:manual', { count: manualPatterns.length, durationMs: Date.now() - manualStart });

        const allPatterns = [...bankPatterns, ...manualPatterns];

        allPatterns.sort((first, second) => {
            const occurrenceDiff = second.occurrenceCount - first.occurrenceCount;
            if (occurrenceDiff !== 0) {
                return occurrenceDiff;
            }

            return second.lastOccurrence - first.lastOccurrence;
        });

        const result = allPatterns.slice(0, query.limit ?? DEFAULT_MONTHLY_LIMIT);
        bankSyncLog('repo:pattern:findMonthlyRecurringPatterns:done', { resultCount: result.length, durationMs: Date.now() - start });

        return result;
    }

    async findAmountBasedPatterns(query: AmountPatternQueryInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const start = Date.now();
        bankSyncLog('repo:pattern:findAmountBasedPatterns:start', { accountId: query.accountId, categoryId: query.categoryId, amountMin: query.amountMin, amountMax: query.amountMax });
        const conditions = this.buildAmountPatternConditions(query);
        const patternRows = await this.executePatternQuery(conditions, query.limit ?? DEFAULT_LIMIT);
        const result = await this.enrichPatternsWithTags(patternRows);
        bankSyncLog('repo:pattern:findAmountBasedPatterns:done', { resultCount: result.length, durationMs: Date.now() - start });

        return result;
    }

    private buildPatternConditions(query: TransactionPatternQueryInterface): SQL[] {
        const weekdayCondition = eq(TransactionEntityTable.operatedWeekday, query.weekday);
        const timeCondition = between(TransactionEntityTable.operatedMinuteOfDay, query.timeWindowStartMinutes, query.timeWindowEndMinutes);

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

    // eslint-disable-next-line max-lines-per-function -- Raw SQL window-function CTE cannot be split further
    private async executeBankSyncedMonthlyQuery(query: MonthlyPatternQueryInterface): Promise<MonthlyPatternRawRowInterface[]> {
        const { entryType, recencyTimestamp, tzOffset, type, defaultInstrumentId, displayMonth } = this.buildMonthlyQueryContext(query);

        const bankSql = `
WITH groups AS (
    SELECT t.title, a.id AS account_id, a.instrument_id,
           te.category_id, cat.title AS cat_title, cat.icon AS cat_icon,
           mcc.short_description AS mcc_short_description,
           CAST(strftime('%d', t.operated_at + ?, 'unixepoch') AS INTEGER) AS day_of_month,
           strftime('%Y-%m', t.operated_at + ?, 'unixepoch') AS year_month,
           t.id AS tx_id, te.amount, t.operated_at
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    INNER JOIN accounts a ON a.id = te.account_id
    LEFT JOIN categories cat ON cat.id = te.category_id
    LEFT JOIN mcc_categories mcc ON mcc.id = te.mcc_category_id
    WHERE t.type = ? AND te.type = ? AND t.deleted_at IS NULL
      AND a.type != 'DEBT' AND t.operated_at >= ? AND t.title != ''
),
day_agg AS (
    SELECT title, account_id, instrument_id, day_of_month,
           COUNT(DISTINCT tx_id) AS day_count
    FROM groups
    GROUP BY title, account_id, instrument_id, day_of_month
),
mode_day AS (
    SELECT title, account_id, instrument_id,
           day_of_month AS mode_day_of_month,
           day_count AS mode_day_count,
           ROW_NUMBER() OVER (PARTITION BY title, account_id ORDER BY day_count DESC, day_of_month ASC) AS rk
    FROM day_agg
),
overall_agg AS (
    SELECT title, account_id, instrument_id,
           COUNT(DISTINCT year_month) AS occurrence_count,
           COUNT(DISTINCT tx_id) AS total_tx_count,
           MAX(amount) AS max_amount, MIN(amount) AS min_amount,
           MAX(operated_at) AS last_occurrence
    FROM groups
    GROUP BY title, account_id, instrument_id
),
filtered AS (
    SELECT oa.title, oa.account_id, oa.instrument_id,
           oa.occurrence_count, oa.total_tx_count, oa.max_amount, oa.min_amount, oa.last_occurrence,
           m.mode_day_of_month, m.mode_day_count
    FROM overall_agg oa
    INNER JOIN mode_day m ON m.title = oa.title AND m.account_id = oa.account_id AND m.rk = 1
    WHERE oa.occurrence_count >= ?
      AND oa.max_amount <= oa.min_amount * ?
      AND m.mode_day_count * ? >= oa.total_tx_count * ?
),
latest_overall AS (
    SELECT g.title, g.account_id, g.tx_id, g.operated_at, g.amount,
           g.category_id, g.cat_title, g.cat_icon, g.mcc_short_description, g.instrument_id,
           ROW_NUMBER() OVER (PARTITION BY g.title, g.account_id ORDER BY g.operated_at DESC, g.tx_id DESC) AS rk
    FROM groups g
    INNER JOIN filtered f ON f.title = g.title AND f.account_id = g.account_id
),
latest_display AS (
    SELECT g.title, g.account_id, g.tx_id, g.day_of_month,
           ROW_NUMBER() OVER (PARTITION BY g.title, g.account_id ORDER BY g.operated_at DESC, g.tx_id DESC) AS rk
    FROM groups g
    INNER JOIN filtered f ON f.title = g.title AND f.account_id = g.account_id
    WHERE g.year_month = ?
)
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
latest_overall AS (
    SELECT g.comment, g.category_id, g.account_id, g.tx_id, g.operated_at, g.amount,
           g.cat_title, g.cat_icon, g.instrument_id,
           ROW_NUMBER() OVER (PARTITION BY g.comment, g.category_id, g.account_id ORDER BY g.operated_at DESC, g.tx_id DESC) AS rk
    FROM groups g
    INNER JOIN filtered f ON f.comment = g.comment AND f.category_id = g.category_id AND f.account_id = g.account_id
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
            displayMonth,
            defaultInstrumentId,
            defaultInstrumentId
        ]);
    }
}
