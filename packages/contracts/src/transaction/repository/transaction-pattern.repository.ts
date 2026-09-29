/* eslint-disable max-lines -- Transaction pattern repository owns recurring-candidate, repeated, and amount pattern queries that share private SQL helpers */
import { Log } from '@budgie/logger';
import { SQL, and, between, desc, eq, gt, gte, inArray, isNotNull, lte, ne, or, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
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
import type { ValidPatternRowInterface } from '../interface/valid-pattern-row.interface';

const DEFAULT_LIMIT = 10;
const MIN_OCCURRENCES = 2;

const TRANSACTION_ENTRY_JOIN_CONDITION = eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id);
const ACCOUNT_JOIN_CONDITION = eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id);
const CATEGORY_JOIN_CONDITION = eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id);

type PatternGroupColumn = 'title' | 'comment';

const PATTERN_GROUP_COLUMNS: PatternGroupColumn[] = ['title', 'comment'];

export class TransactionPatternRepository extends BaseTransactionFilterRepository {
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

                return this.enrichPatterns(patternRows, groupColumn);
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

                return this.enrichPatterns(patternRows, groupColumn);
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
                    this.buildVisibleTransactionCondition(),
                    eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT),
                    this.buildCategorizableEntryCondition(),
                    this.buildNonDebtAccountCondition(),
                    isNotNull(TransactionEntryEntityTable.categoryId),
                    gt(TransactionEntryEntityTable.amount, 0),
                    gte(TransactionEntityTable.operatedAt, query.since),
                    or(ne(TransactionEntityTable.title, ''), ne(TransactionEntityTable.comment, ''))
                )
            );
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
            this.buildVisibleTransactionCondition(),
            eq(TransactionEntryEntityTable.type, entryType),
            this.buildCategorizableEntryCondition(),
            this.buildNonDebtAccountCondition(),
            isNotNull(TransactionEntryEntityTable.categoryId),
            this.buildTitleScopeCondition(groupColumn),
            ...(groupColumn === 'title' ? [] : [ne(TransactionEntityTable.comment, '')])
        ].filter(isDefined);

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
        const titleSource = this.getTitleSource(groupColumn);
        const localizedCategoryTitle = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`;

        return this.db
            .select({
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitle: localizedCategoryTitle.as('categoryTitle'),
                categoryIcon: CategoryEntityTable.icon,
                title: titleSource,
                comment: sql<string | null>`MAX(${TransactionEntityTable.comment})`.as('comment'),
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

    private async enrichPatterns(
        patternRows: PatternRowInterface[],
        groupColumn: PatternGroupColumn
    ): Promise<RepeatedTransactionPatternInterface[]> {
        const validRows = patternRows.filter(isValidPatternRow);

        if (!isNotEmptyArray(validRows)) {
            return [];
        }

        const [tagMap, latestAmountMap] = await Promise.all([
            this.findTagsForPatterns(validRows, groupColumn),
            this.findLatestAmountsForPatterns(validRows, groupColumn)
        ]);

        return validRows.map(row => ({
            ...row,
            tagIds: tagMap.get(`${row.categoryId}-${row.title}`) ?? [],
            latestAmount: latestAmountMap.get(`${row.categoryId}-${row.title}`) ?? 0,
            lastOccurrence: new Date(row.lastOccurrence * 1000),
            accountDeletedAt: isDefined(row.accountDeletedAt) ? new Date(row.accountDeletedAt * 1000) : null
        }));
    }

    // eslint-disable-next-line max-statements -- Batched tag query replacing N+1 pattern
    private async findTagsForPatterns(
        patterns: ValidPatternRowInterface[],
        groupColumn: PatternGroupColumn
    ): Promise<Map<string, number[]>> {
        const tagMap = new Map<string, number[]>();
        const titleSource = this.getTitleSource(groupColumn);

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
            .where(this.buildPatternLookupWhere(patterns, groupColumn))
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

    private async findLatestAmountsForPatterns(
        patterns: ValidPatternRowInterface[],
        groupColumn: PatternGroupColumn
    ): Promise<Map<string, number>> {
        const titleSource = this.getTitleSource(groupColumn);
        const amountRows = await this.db
            .select({ categoryId: TransactionEntryEntityTable.categoryId, title: titleSource, amount: TransactionEntryEntityTable.amount })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, TRANSACTION_ENTRY_JOIN_CONDITION)
            .where(this.buildPatternLookupWhere(patterns, groupColumn))
            .orderBy(TransactionEntityTable.operatedAt, desc(TransactionEntityTable.id));

        return new Map(amountRows.map(row => [`${row.categoryId}-${row.title}`, row.amount]));
    }

    private buildPatternLookupWhere(patterns: ValidPatternRowInterface[], groupColumn: PatternGroupColumn) {
        return and(
            inArray(TransactionEntryEntityTable.categoryId, [...new Set(patterns.map(pattern => pattern.categoryId))]),
            inArray(this.getTitleSource(groupColumn), [...new Set(patterns.map(pattern => pattern.title))]),
            this.buildTitleScopeCondition(groupColumn),
            this.buildVisibleTransactionCondition(),
            this.buildCategorizableEntryCondition()
        );
    }

    private buildTitleScopeCondition(groupColumn: PatternGroupColumn) {
        return groupColumn === 'title' ? ne(TransactionEntityTable.title, '') : eq(TransactionEntityTable.title, '');
    }

    private getTitleSource(groupColumn: PatternGroupColumn) {
        return groupColumn === 'title' ? TransactionEntityTable.title : TransactionEntityTable.comment;
    }

    private getEntryTypeForTransactionType(type: TransactionTypeEnum): TransactionEntryTypeEnum {
        return type === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
    }
}
