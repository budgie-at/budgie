/* eslint-disable max-lines -- Transaction pattern repository owns recurring-candidate, repeated, and amount pattern queries that share private SQL helpers */
import { Log } from '@budgie/logger';
import { SQL, and, between, desc, eq, gt, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { DB } from '../../@generic/type/db.type';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';
import { isValidPatternRow } from '../type-guard/is-valid-pattern-row.type-guard';

import type { AmountPatternQueryInterface } from '../interface/amount-pattern-query.interface';
import type { PatternRowInterface } from '../interface/pattern-row.interface';
import type { RecurringChargeCandidateQueryInterface } from '../interface/recurring-charge-candidate-query.interface';
import type { RepeatedTransactionPatternInterface } from '../interface/repeated-transaction-pattern.interface';
import type { TransactionPatternQueryInterface } from '../interface/transaction-pattern-query.interface';

const DEFAULT_LIMIT = 10;
const MIN_OCCURRENCES = 2;

const TRANSACTION_ENTRY_JOIN_CONDITION = eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id);
const ACCOUNT_JOIN_CONDITION = eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id);
const CATEGORY_JOIN_CONDITION = eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id);

type PatternGroupColumn = 'title' | 'comment';

const PATTERN_GROUP_COLUMNS: PatternGroupColumn[] = ['title', 'comment'];

export class TransactionPatternRepository {
    constructor(private db: DB) {}

    @Log(
        (query, language) =>
            `enter type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} weekday=${query.weekday} window=${query.timeWindowStartMinutes}-${query.timeWindowEndMinutes} language=${language}`,
        (result, query, language) =>
            `done type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} weekday=${query.weekday} window=${query.timeWindowStartMinutes}-${query.timeWindowEndMinutes} language=${language} categoryIds=${result.map(pattern => pattern.categoryId).join(',')} titles=${result.map(pattern => pattern.title).join('|')}`,
        (error, query, language) =>
            `throw type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} weekday=${query.weekday} window=${query.timeWindowStartMinutes}-${query.timeWindowEndMinutes} language=${language} error=${getErrorMessage(error)}`
    )
    async findRepeatedPatterns(
        query: TransactionPatternQueryInterface,
        language: LanguageEnum
    ): Promise<RepeatedTransactionPatternInterface[]> {
        const limit = query.limit ?? DEFAULT_LIMIT;
        const pathResults = await Promise.all(
            PATTERN_GROUP_COLUMNS.map(async groupColumn => {
                const conditions = this.buildPatternConditions(query, groupColumn);
                const patternRows = await this.executePatternQuery(conditions, limit, groupColumn, language);

                return this.enrichPatternsWithTags(patternRows, groupColumn);
            })
        );

        return this.mergePatternResults(pathResults, limit);
    }

    @Log(
        (query, language) =>
            `enter type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} amountMin=${query.amountMin} amountMax=${query.amountMax} language=${language}`,
        (result, query, language) =>
            `done type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} amountMin=${query.amountMin} amountMax=${query.amountMax} language=${language} categoryIds=${result.map(pattern => pattern.categoryId).join(',')} titles=${result.map(pattern => pattern.title).join('|')}`,
        (error, query, language) =>
            `throw type=${query.type} accountId=${query.accountId ?? 0} categoryId=${query.categoryId ?? 0} amountMin=${query.amountMin} amountMax=${query.amountMax} language=${language} error=${getErrorMessage(error)}`
    )
    async findAmountBasedPatterns(
        query: AmountPatternQueryInterface,
        language: LanguageEnum
    ): Promise<RepeatedTransactionPatternInterface[]> {
        const limit = query.limit ?? DEFAULT_LIMIT;
        const pathResults = await Promise.all(
            PATTERN_GROUP_COLUMNS.map(async groupColumn => {
                const conditions = this.buildAmountPatternConditions(query, groupColumn);
                const patternRows = await this.executePatternQuery(conditions, limit, groupColumn, language);

                return this.enrichPatternsWithTags(patternRows, groupColumn);
            })
        );

        return this.mergePatternResults(pathResults, limit);
    }

    findRecurringChargeCandidates(query: RecurringChargeCandidateQueryInterface) {
        const defaultAmount = sql<number>`${TransactionEntryEntityTable.amount} * COALESCE(
            (SELECT ${ExchangeRateEntityTable.rate} * 1.0 FROM ${ExchangeRateEntityTable}
             WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${AccountEntityTable.instrumentId}
               AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${query.defaultInstrumentId}
               AND ${ExchangeRateEntityTable.deletedAt} IS NULL
             ORDER BY ${ExchangeRateEntityTable.createdAt} DESC LIMIT 1),
            (SELECT 1.0 / ${ExchangeRateEntityTable.rate} FROM ${ExchangeRateEntityTable}
             WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${query.defaultInstrumentId}
               AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${AccountEntityTable.instrumentId}
               AND ${ExchangeRateEntityTable.deletedAt} IS NULL
             ORDER BY ${ExchangeRateEntityTable.createdAt} DESC LIMIT 1),
            1.0
        )`;

        return this.db
            .select({
                transactionId: TransactionEntityTable.id,
                operatedAt: TransactionEntityTable.operatedAt,
                title: TransactionEntityTable.title,
                comment: TransactionEntityTable.comment,
                defaultAmount,
                accountId: AccountEntityTable.id,
                instrumentId: AccountEntityTable.instrumentId,
                categoryId: sql<number>`${TransactionEntryEntityTable.categoryId}`,
                categoryTitle: sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`,
                categoryIcon: CategoryEntityTable.icon
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, TRANSACTION_ENTRY_JOIN_CONDITION)
            .innerJoin(AccountEntityTable, ACCOUNT_JOIN_CONDITION)
            .innerJoin(CategoryEntityTable, CATEGORY_JOIN_CONDITION)
            .leftJoin(
                DefaultCategoryTranslationEntityTable,
                and(
                    eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                    eq(DefaultCategoryTranslationEntityTable.language, query.language)
                )
            )
            .where(
                and(
                    eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                    isNull(TransactionEntityTable.deletedAt),
                    isNull(TransactionEntityTable.consolidationParentTransactionId),
                    eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT),
                    isNull(TransactionEntryEntityTable.deletedAt),
                    isNull(TransactionEntryEntityTable.originalTransactionId),
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT),
                    isNotNull(TransactionEntryEntityTable.categoryId),
                    gt(TransactionEntryEntityTable.amount, 0),
                    gte(TransactionEntityTable.operatedAt, query.since),
                    or(ne(TransactionEntityTable.title, ''), ne(TransactionEntityTable.comment, ''))
                )
            );
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
                  AND t2.consolidation_parent_transaction_id IS NULL
                  AND te2.original_transaction_id IS NULL
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
              AND t2.consolidation_parent_transaction_id IS NULL
              AND te2.original_transaction_id IS NULL
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
            isNull(TransactionEntityTable.consolidationParentTransactionId),
            eq(TransactionEntryEntityTable.type, entryType),
            isNull(TransactionEntryEntityTable.originalTransactionId),
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

    private async executePatternQuery(
        conditions: SQL[],
        limit: number,
        groupColumn: PatternGroupColumn,
        language: LanguageEnum
    ): Promise<PatternRowInterface[]> {
        const titleSource = groupColumn === 'title' ? TransactionEntityTable.title : TransactionEntityTable.comment;
        const localizedCategoryTitle = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`;

        return this.db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitle: localizedCategoryTitle.as('categoryTitle'),
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
            .leftJoin(
                DefaultCategoryTranslationEntityTable,
                and(
                    eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                    eq(DefaultCategoryTranslationEntityTable.language, language)
                )
            )
            .where(and(...conditions))
            .groupBy(TransactionEntryEntityTable.categoryId, titleSource, localizedCategoryTitle)
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
                    isNull(TransactionEntityTable.deletedAt),
                    isNull(TransactionEntityTable.consolidationParentTransactionId),
                    isNull(TransactionEntryEntityTable.originalTransactionId)
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
}
