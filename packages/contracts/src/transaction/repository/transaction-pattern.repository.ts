/* eslint-disable max-lines -- Transaction pattern repository owns repeated and amount pattern queries that share private SQL helpers */
import { SQL, and, between, desc, eq, gte, inArray, isNotNull, lte, ne, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';
import { isValidPatternRow } from '../type-guard/is-valid-pattern-row.type-guard';

import type { AmountPatternQueryInterface } from '../interface/amount-pattern-query.interface';
import type { PatternRowInterface } from '../interface/pattern-row.interface';
import type { RepeatedTransactionPatternInterface } from '../interface/repeated-transaction-pattern.interface';
import type { TransactionPatternQueryInterface } from '../interface/transaction-pattern-query.interface';
import type { ValidPatternRowInterface } from '../interface/valid-pattern-row.interface';

const DEFAULT_LIMIT = 10;
const MIN_OCCURRENCES = 2;

const TRANSACTION_ENTRY_JOIN_CONDITION = eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id);
const ACCOUNT_JOIN_CONDITION = eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id);
const CATEGORY_JOIN_CONDITION = eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id);

const buildCategoryTranslationJoinCondition = (language: LanguageEnum) =>
    and(
        eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
        eq(DefaultCategoryTranslationEntityTable.language, language)
    );

type PatternGroupColumn = 'title' | 'comment';

const PATTERN_GROUP_COLUMNS: PatternGroupColumn[] = ['title', 'comment'];

export class TransactionPatternRepository extends Context.Service<TransactionPatternRepository>()(
    '@budgie/contracts/TransactionPatternRepository',
    {
        make: Effect.sync(() => {
            const transactionFilters = new BaseTransactionFilterRepository();

            const buildTitleScopeCondition = (groupColumn: PatternGroupColumn) =>
                groupColumn === 'title' ? ne(TransactionEntityTable.title, '') : eq(TransactionEntityTable.title, '');

            const getTitleSource = (groupColumn: PatternGroupColumn) =>
                groupColumn === 'title' ? TransactionEntityTable.title : TransactionEntityTable.comment;

            const buildPatternLookupWhere = (patterns: ValidPatternRowInterface[], groupColumn: PatternGroupColumn) =>
                and(
                    inArray(TransactionEntryEntityTable.categoryId, [...new Set(patterns.map(pattern => pattern.categoryId))]),
                    inArray(getTitleSource(groupColumn), [...new Set(patterns.map(pattern => pattern.title))]),
                    buildTitleScopeCondition(groupColumn),
                    transactionFilters.buildVisibleTransactionCondition(),
                    transactionFilters.buildCategorizableEntryCondition()
                );

            const findLatestAmountsForPatterns = Effect.fnUntraced(function* (
                patterns: ValidPatternRowInterface[],
                groupColumn: PatternGroupColumn
            ) {
                const titleSource = getTitleSource(groupColumn);
                const amountRows = yield* Db.query(db =>
                    db
                        .select({
                            categoryId: TransactionEntryEntityTable.categoryId,
                            title: titleSource,
                            amount: TransactionEntryEntityTable.amount
                        })
                        .from(TransactionEntityTable)
                        .innerJoin(TransactionEntryEntityTable, TRANSACTION_ENTRY_JOIN_CONDITION)
                        .where(buildPatternLookupWhere(patterns, groupColumn))
                        .orderBy(TransactionEntityTable.operatedAt, desc(TransactionEntityTable.id))
                );

                return new Map(amountRows.map(row => [`${row.categoryId}-${row.title}`, row.amount]));
            });

            // eslint-disable-next-line max-statements -- Batched tag query replacing N+1 pattern
            const findTagsForPatterns = Effect.fnUntraced(function* (
                patterns: ValidPatternRowInterface[],
                groupColumn: PatternGroupColumn
            ) {
                const tagMap = new Map<string, number[]>();
                const titleSource = getTitleSource(groupColumn);

                const tagRows = yield* Db.query(db =>
                    db
                        .select({
                            categoryId: TransactionEntryEntityTable.categoryId,
                            title: titleSource,
                            tagId: TransactionTagsEntityTable.tagId,
                            tagCount: sql<number>`COUNT(${TransactionTagsEntityTable.tagId})`.as('tagCount')
                        })
                        .from(TransactionTagsEntityTable)
                        .innerJoin(TransactionEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .where(buildPatternLookupWhere(patterns, groupColumn))
                        .groupBy(TransactionEntryEntityTable.categoryId, titleSource, TransactionTagsEntityTable.tagId)
                        .orderBy(TransactionEntryEntityTable.categoryId, titleSource, desc(sql`COUNT(${TransactionTagsEntityTable.tagId})`))
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
            });

            const enrichPatterns = Effect.fnUntraced(function* (patternRows: PatternRowInterface[], groupColumn: PatternGroupColumn) {
                const validRows = patternRows.filter(isValidPatternRow);

                if (!isNotEmptyArray(validRows)) {
                    return [];
                }

                const tagMap = yield* findTagsForPatterns(validRows, groupColumn);
                const latestAmountMap = yield* findLatestAmountsForPatterns(validRows, groupColumn);

                return validRows.map(row => ({
                    ...row,
                    tagIds: tagMap.get(`${row.categoryId}-${row.title}`) ?? [],
                    latestAmount: latestAmountMap.get(`${row.categoryId}-${row.title}`) ?? 0,
                    lastOccurrence: new Date(row.lastOccurrence * 1000),
                    accountDeletedAt: isDefined(row.accountDeletedAt) ? new Date(row.accountDeletedAt * 1000) : null
                }));
            });

            const executePatternQuery = (conditions: SQL[], limit: number, groupColumn: PatternGroupColumn, language: LanguageEnum) => {
                const titleSource = getTitleSource(groupColumn);
                const localizedCategoryTitle = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`;

                return Db.query(db =>
                    db
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
                        .leftJoin(DefaultCategoryTranslationEntityTable, buildCategoryTranslationJoinCondition(language))
                        .where(and(...conditions))
                        .groupBy(TransactionEntryEntityTable.categoryId, titleSource, localizedCategoryTitle)
                        .having(sql`COUNT(DISTINCT ${TransactionEntityTable.id}) >= ${MIN_OCCURRENCES}`)
                        .orderBy(
                            desc(sql`MAX(${TransactionEntityTable.operatedAt})`),
                            desc(sql`COUNT(DISTINCT ${TransactionEntityTable.id})`)
                        )
                        .limit(limit)
                );
            };

            const mergePatternResults = (
                pathResults: RepeatedTransactionPatternInterface[][],
                limit: number
            ): RepeatedTransactionPatternInterface[] =>
                pathResults
                    .flat()
                    .sort(
                        (first, second) =>
                            second.lastOccurrence.getTime() - first.lastOccurrence.getTime() ||
                            second.occurrenceCount - first.occurrenceCount
                    )
                    .slice(0, limit);

            const getEntryTypeForTransactionType = (type: TransactionTypeEnum): TransactionEntryTypeEnum =>
                type === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;

            const buildBasePatternConditions = (
                query: { type: TransactionTypeEnum; accountId?: number; categoryId?: number },
                groupColumn: PatternGroupColumn
            ): SQL[] => {
                const entryType = getEntryTypeForTransactionType(query.type);

                const conditions: SQL[] = [
                    eq(TransactionEntityTable.type, query.type),
                    transactionFilters.buildVisibleTransactionCondition(),
                    eq(TransactionEntryEntityTable.type, entryType),
                    transactionFilters.buildCategorizableEntryCondition(),
                    transactionFilters.buildNonDebtAccountCondition(),
                    isNotNull(TransactionEntryEntityTable.categoryId),
                    buildTitleScopeCondition(groupColumn),
                    ...(groupColumn === 'title' ? [] : [ne(TransactionEntityTable.comment, '')])
                ].filter(isDefined);

                if (isPositiveNumber(query.accountId)) {
                    conditions.push(eq(TransactionEntryEntityTable.accountId, query.accountId));
                }

                if (isPositiveNumber(query.categoryId)) {
                    conditions.push(eq(TransactionEntryEntityTable.categoryId, query.categoryId));
                }

                return conditions;
            };

            const buildPatternConditions = (query: TransactionPatternQueryInterface, groupColumn: PatternGroupColumn): SQL[] => {
                const weekdayCondition = eq(TransactionEntityTable.operatedWeekday, query.weekday);
                const timeCondition = between(
                    TransactionEntityTable.operatedMinuteOfDay,
                    query.timeWindowStartMinutes,
                    query.timeWindowEndMinutes
                );

                const conditions = buildBasePatternConditions(query, groupColumn);
                conditions.push(weekdayCondition, timeCondition);

                return conditions;
            };

            const buildAmountPatternConditions = (query: AmountPatternQueryInterface, groupColumn: PatternGroupColumn): SQL[] => {
                const conditions = buildBasePatternConditions(query, groupColumn);
                conditions.push(
                    gte(TransactionEntryEntityTable.amount, query.amountMin),
                    lte(TransactionEntryEntityTable.amount, query.amountMax)
                );

                return conditions;
            };

            return {
                findRepeatedPatterns: Effect.fn('TransactionPatternRepository.findRepeatedPatterns')(function* (
                    query: TransactionPatternQueryInterface,
                    language: LanguageEnum
                ) {
                    const limit = query.limit ?? DEFAULT_LIMIT;
                    const pathResults = yield* Effect.forEach(PATTERN_GROUP_COLUMNS, groupColumn =>
                        executePatternQuery(buildPatternConditions(query, groupColumn), limit, groupColumn, language).pipe(
                            Effect.flatMap(patternRows => enrichPatterns(patternRows, groupColumn))
                        )
                    );

                    return mergePatternResults(pathResults, limit);
                }),

                findAmountBasedPatterns: Effect.fn('TransactionPatternRepository.findAmountBasedPatterns')(function* (
                    query: AmountPatternQueryInterface,
                    language: LanguageEnum
                ) {
                    const limit = query.limit ?? DEFAULT_LIMIT;
                    const pathResults = yield* Effect.forEach(PATTERN_GROUP_COLUMNS, groupColumn =>
                        executePatternQuery(buildAmountPatternConditions(query, groupColumn), limit, groupColumn, language).pipe(
                            Effect.flatMap(patternRows => enrichPatterns(patternRows, groupColumn))
                        )
                    );

                    return mergePatternResults(pathResults, limit);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionPatternRepository, TransactionPatternRepository.make);
}
