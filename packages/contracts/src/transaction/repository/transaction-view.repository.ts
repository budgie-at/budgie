import { Column, SQL, and, count, eq, getColumnTable, getTableColumns, inArray, is, or, sql } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { DebtEventAssociationEnum } from '../../debt-event/enum/debt-event-association.enum';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsAssociationEnum } from '../../transaction-tags/enum/transaction-tags-association.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { SimilarTransactionMonthRowInterface } from '../interface/similar-transaction-month-row.interface';
import type { SimilarTransactionStatsQueryInterface } from '../interface/similar-transaction-stats-query.interface';

export class TransactionViewRepository extends Context.Service<TransactionViewRepository>()('@budgie/contracts/TransactionViewRepository', {
    make: Effect.sync(() => {
        const filters = new BaseTransactionFilterRepository();

        const queryBuilder = new QueryBuilder();

        const mapTransactionColumns = (query: SQL, transactionTable: typeof TransactionEntityTable): SQL =>
            sql.join(
                query.queryChunks.map(chunk => {
                    if (is(chunk, Column) && getColumnTable(chunk) === TransactionEntityTable) {
                        return Object.values(getTableColumns(transactionTable)).find(column => column.name === chunk.name) ?? chunk;
                    }

                    return is(chunk, SQL) ? mapTransactionColumns(chunk, transactionTable) : chunk;
                })
            );

        const buildSimilarIdentityConditions = (query: SimilarTransactionStatsQueryInterface): string[] => {
            const conditions: string[] = [];

            if (isNotEmptyString(query.title)) {
                conditions.push('LOWER(t.title) = LOWER(?)');
            } else if (isNotEmptyString(query.comment)) {
                conditions.push('LOWER(t.comment) = LOWER(?)');
            }

            if (isDefined(query.categoryId) && isPositiveNumber(query.categoryId)) {
                conditions.push('te.category_id = ?');
            }

            return conditions;
        };

        const buildSimilarStatsSql = (query: SimilarTransactionStatsQueryInterface): string => {
            const conditions = [
                't.id != ?',
                't.type = ?',
                't.deleted_at IS NULL',
                't.consolidation_parent_transaction_id IS NULL',
                'te.deleted_at IS NULL',
                'te.original_transaction_id IS NULL',
                'te.account_id = ?',
                't.operated_at >= ?',
                't.operated_at < ?',
                ...buildSimilarIdentityConditions(query)
            ];

            return `
            SELECT
                strftime('%Y-%m', t.operated_at, 'unixepoch') AS monthKey,
                SUM(te.amount) AS totalAmount,
                COUNT(DISTINCT t.id) AS count,
                MAX(instrument.symbol) AS currencySymbol
            FROM transactions t
            INNER JOIN transaction_entries te ON te.transaction_id = t.id
            INNER JOIN accounts account ON account.id = te.account_id
            INNER JOIN instruments instrument ON instrument.id = account.instrument_id
            WHERE ${conditions.join(' AND ')}
            GROUP BY monthKey
            ORDER BY monthKey ASC
        `;
        };

        const getSimilarStatsSinceDate = (query: SimilarTransactionStatsQueryInterface): Date => {
            const since = new Date(query.operatedAt);
            since.setDate(1);
            since.setHours(0, 0, 0, 0);
            since.setMonth(since.getMonth() - query.months + 1);

            return since;
        };

        const buildSimilarStatsParams = (query: SimilarTransactionStatsQueryInterface): (number | string)[] => {
            const operatedAtSeconds = Math.floor(query.operatedAt.getTime() / 1000);
            const sinceSeconds = Math.floor(getSimilarStatsSinceDate(query).getTime() / 1000);
            const params: (number | string)[] = [query.transactionId, query.type, query.accountId, sinceSeconds, operatedAtSeconds];

            if (isNotEmptyString(query.title)) {
                params.push(query.title);
            } else if (isNotEmptyString(query.comment)) {
                params.push(query.comment);
            }

            if (isDefined(query.categoryId) && isPositiveNumber(query.categoryId)) {
                params.push(query.categoryId);
            }

            return params;
        };

        const buildAdjustmentCondition = (type: TransactionEntryTypeEnum) =>
            and(
                eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
                inArray(
                    TransactionEntityTable.id,
                    queryBuilder
                        .select({ transactionId: TransactionEntryEntityTable.transactionId })
                        .from(TransactionEntryEntityTable)
                        .where(and(eq(TransactionEntryEntityTable.type, type), filters.buildLedgerEntryCondition()))
                )
            );

        const buildTypeCondition = (types: TransactionTypeEnum[]) =>
            or(
                inArray(TransactionEntityTable.type, types),
                ...(types.includes(TransactionTypeEnum.EXPENSE) ? [buildAdjustmentCondition(TransactionEntryTypeEnum.CREDIT)] : []),
                ...(types.includes(TransactionTypeEnum.INCOME) ? [buildAdjustmentCondition(TransactionEntryTypeEnum.DEBIT)] : [])
            );

        const buildWhere = (transactionFilters: TransactionFilterInterface) =>
            and(
                filters.buildFilterWhere(transactionFilters),
                ...(isNotEmptyArray(transactionFilters.types) ? [buildTypeCondition(transactionFilters.types)] : [])
            );

        const buildUncategorizedWhere = (transactionFilters: TransactionFilterInterface) =>
            and(
                filters.buildFilterWhere({ ...transactionFilters, categoryIds: [] }),
                filters.buildCategorizableTypeCondition(transactionFilters.types)
            );

        const buildFullRelations = (language: LanguageEnum) =>
            ({
                [TransactionAssociationEnum.ENTRIES]: {
                    where: filters.buildLedgerEntryFilter(),
                    with: {
                        [TransactionEntryAssociationEnum.ACCOUNT]: {
                            with: {
                                [AccountAssociationEnum.INSTRUMENT]: true
                            }
                        },
                        [TransactionEntryAssociationEnum.CATEGORY]: buildTranslatedCategoryRelation(language),
                        [TransactionEntryAssociationEnum.MCC_CATEGORY]: true
                    }
                },
                [TransactionAssociationEnum.TRANSACTION_TAGS]: {
                    with: {
                        [TransactionTagsAssociationEnum.TAG]: true
                    }
                },
                [TransactionAssociationEnum.DEBT_EVENTS]: {
                    where: { deletedAt: { isNull: true } },
                    with: {
                        [DebtEventAssociationEnum.DEBT_ACCOUNT]: {
                            with: {
                                [AccountAssociationEnum.INSTRUMENT]: true
                            }
                        }
                    }
                },
                [TransactionAssociationEnum.FROM_ACCOUNT]: true,
                [TransactionAssociationEnum.TO_ACCOUNT]: true
            }) as const;

        const listOrderedByOperatedAt = (limit: number, language: LanguageEnum, where: SQL | null | undefined) =>
            Db.query(db =>
                db.query.TransactionEntityTable.findMany({
                    with: buildFullRelations(language),
                    orderBy: (transaction, { desc }) => [desc(transaction.operatedAt), desc(transaction.id)],
                    limit,
                    ...(isDefined(where)
                        ? {
                              where: {
                                  RAW: (transactionTable: typeof TransactionEntityTable) => mapTransactionColumns(where, transactionTable)
                              }
                          }
                        : {})
                })
            );

        return {
            findSimilarStats: Effect.fn('TransactionViewRepository.findSimilarStats')(function* (
                query: SimilarTransactionStatsQueryInterface
            ) {
                if (!isPositiveNumber(query.accountId) || !isPositiveNumber(query.months)) {
                    return null;
                }

                const rows = yield* Db.query(db =>
                    db.$client.unsafe<SimilarTransactionMonthRowInterface>(buildSimilarStatsSql(query), buildSimilarStatsParams(query))
                );

                if (isEmptyArray(rows)) {
                    return null;
                }

                const count = rows.reduce((sum, row) => sum + row.count, 0);
                const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);
                const firstRow = rows.at(0);
                const currencySymbol = isDefined(firstRow) ? firstRow.currencySymbol : '';

                return {
                    count,
                    totalAmount,
                    averageAmount: count > 0 ? totalAmount / count : 0,
                    currencySymbol,
                    months: rows
                };
            }),

            getAll: (limit: number, transactionFilters: TransactionFilterInterface, language: LanguageEnum) =>
                listOrderedByOperatedAt(limit, language, buildWhere(transactionFilters)),

            countAll: (transactionFilters: TransactionFilterInterface) =>
                Db.query(db => db.select({ value: count() }).from(TransactionEntityTable).where(buildWhere(transactionFilters))),

            getUncategorized: (limit: number, transactionFilters: TransactionFilterInterface, language: LanguageEnum) =>
                listOrderedByOperatedAt(limit, language, buildUncategorizedWhere(transactionFilters)),

            countUncategorized: (transactionFilters: TransactionFilterInterface) =>
                Db.query(db =>
                    db
                        .select({
                            income: sql<number>`COALESCE(SUM(CASE WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.INCOME} THEN 1 ELSE 0 END), 0)`.mapWith(
                                Number
                            ),
                            expense:
                                sql<number>`COALESCE(SUM(CASE WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.EXPENSE} THEN 1 ELSE 0 END), 0)`.mapWith(
                                    Number
                                )
                        })
                        .from(TransactionEntityTable)
                        .where(buildUncategorizedWhere(transactionFilters))
                ),

            getById: (id: number, language: LanguageEnum) =>
                Db.query(db =>
                    db.query.TransactionEntityTable.findFirst({
                        where: { id },
                        with: buildFullRelations(language)
                    })
                )
        };
    })
}) {
    static readonly layer = Layer.effect(TransactionViewRepository, TransactionViewRepository.make);
}
