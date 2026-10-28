/* eslint-disable max-lines -- Transaction repository is the kitchen sink for tx queries + filter builders + bank-sync helpers */
import { SQL, and, count, eq, gte, inArray, isNotNull, isNull, lte, ne, notExists, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';
import { deriveEmbeddingFlag } from '../utils/derive-embedding-flag.util';

import type { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import type { TransactionUpdatedByEnum } from '../enum/transaction-updated-by.enum';
import type { TransactionUpdateInputInterface } from '../input/transaction-update-input.interface';
import type { PotentialExpenseDuplicateInputInterface } from '../interface/potential-expense-duplicate-input.interface';

export class TransactionRepository extends Context.Service<TransactionRepository>()('@budgie/contracts/TransactionRepository', {
    make: Effect.sync(() => {
        const NOT_DELETED_ENTRY_RELATION_WHERE = { deletedAt: { isNull: true } } as const;
        const ENTRIES_WITH_MCC_CATEGORY_RELATIONS = {
            [TransactionAssociationEnum.ENTRIES]: {
                where: transactionFilters.ledgerEntryFilter,
                with: { [TransactionEntryAssociationEnum.MCC_CATEGORY]: true }
            }
        } as const;

        const selectOperatedAtTime = Effect.fnUntraced(function* (aggregateSql: SQL<number | null>, condition: SQL | undefined) {
            const result = yield* Db.query(db =>
                db
                    .select({ operatedAt: aggregateSql })
                    .from(TransactionEntityTable)
                    .where(and(condition, ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT)))
            );

            const time = result[0]?.operatedAt;
            if (isPositiveNumber(time)) {
                return new Date(time * 1000);
            }

            return null;
        });

        const findByIdsWithEntriesWhere = Effect.fnUntraced(function* (
            ids: number[],
            entriesWhere: typeof transactionFilters.ledgerEntryFilter | typeof NOT_DELETED_ENTRY_RELATION_WHERE
        ) {
            if (isNotEmptyArray(ids)) {
                return yield* Db.query(db =>
                    db.query.TransactionEntityTable.findMany({
                        where: { id: { in: ids } },
                        with: {
                            [TransactionAssociationEnum.ENTRIES]: {
                                where: entriesWhere
                            }
                        }
                    })
                );
            }

            return [];
        });

        const bulkCreate = Effect.fn('TransactionRepository.bulkCreate')(function* (inputs: TransactionCreateEntityInterface[]) {
            if (isNotEmptyArray(inputs)) {
                return yield* Db.query(db => db.insert(TransactionEntityTable).values(inputs).returning());
            }

            return [];
        });

        return {
            bulkCreate,
            findPotentialExpenseDuplicate: Effect.fn('TransactionRepository.findPotentialExpenseDuplicate')(function* (
                input: PotentialExpenseDuplicateInputInterface
            ) {
                const candidates = yield* Db.query(db =>
                    db
                        .select({
                            id: TransactionEntityTable.id,
                            title: TransactionEntityTable.title,
                            consolidationParentTransactionId: TransactionEntityTable.consolidationParentTransactionId
                        })
                        .from(TransactionEntityTable)
                        .innerJoin(
                            TransactionEntryEntityTable,
                            or(
                                and(
                                    eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
                                    isNull(TransactionEntryEntityTable.originalTransactionId)
                                ),
                                and(
                                    eq(TransactionEntryEntityTable.originalTransactionId, TransactionEntityTable.id),
                                    isNotNull(TransactionEntityTable.consolidationParentTransactionId)
                                )
                            )
                        )
                        .where(
                            and(
                                isNull(TransactionEntityTable.deletedAt),
                                isNull(TransactionEntryEntityTable.deletedAt),
                                inArray(TransactionEntityTable.type, [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.DEBT]),
                                or(
                                    isNull(TransactionEntityTable.externalSource),
                                    inArray(TransactionEntityTable.externalSource, [
                                        ExternalSourceEnum.APPLE_PAY_AUTOMATION,
                                        ExternalSourceEnum.MANUAL
                                    ])
                                ),
                                eq(TransactionEntryEntityTable.accountId, input.accountId),
                                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT),
                                eq(TransactionEntryEntityTable.amount, input.amountInMicroUnits),
                                gte(
                                    TransactionEntityTable.operatedAt,
                                    new Date(input.operatedAt.getTime() - input.timeWindowSeconds * 1000)
                                ),
                                lte(
                                    TransactionEntityTable.operatedAt,
                                    new Date(input.operatedAt.getTime() + input.timeWindowSeconds * 1000)
                                )
                            )
                        )
                );
                const duplicate = candidates.find(candidate => candidate.title.trim().toLocaleLowerCase() === input.normalizedTitle);

                return duplicate?.consolidationParentTransactionId ?? duplicate?.id ?? null;
            }),

            touchUpdatedByIds: Effect.fn('TransactionRepository.touchUpdatedByIds')(function* (
                ids: number[],
                updatedBy: TransactionUpdatedByEnum
            ) {
                if (!isNotEmptyArray(ids)) {
                    return;
                }

                yield* Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ updatedAt: new Date(), updatedBy })
                        .where(inArray(TransactionEntityTable.id, ids))
                );
            }),

            create: Effect.fn('TransactionRepository.create')(function* (input: TransactionCreateEntityInterface) {
                const [transaction] = yield* bulkCreate([input]);

                return transaction;
            }),

            updateById: Effect.fn('TransactionRepository.updateById')(function* (id: number, input: TransactionUpdateInputInterface) {
                const finalInput = { ...input, ...deriveEmbeddingFlag(input) };
                const [transaction] = yield* Db.query(db =>
                    db.update(TransactionEntityTable).set(finalInput).where(eq(TransactionEntityTable.id, id)).returning()
                );

                if (!isDefined(transaction)) {
                    return yield* Effect.die(new Error(`Transaction ${id} not found`));
                }

                return transaction;
            }),

            findByIdsWithEntries: Effect.fn('TransactionRepository.findByIdsWithEntries')(function* (ids: number[]) {
                if (!isNotEmptyArray(ids)) {
                    return [];
                }

                return yield* Db.query(db =>
                    db.query.TransactionEntityTable.findMany({
                        where: { id: { in: ids } },
                        with: ENTRIES_WITH_MCC_CATEGORY_RELATIONS
                    })
                );
            }),

            getAllAfter: (cursorId: number | null, limit: number) =>
                Db.query(db =>
                    db.query.TransactionEntityTable.findMany({
                        with: {
                            [TransactionAssociationEnum.ENTRIES]: {
                                where: transactionFilters.ledgerEntryFilter
                            }
                        },
                        orderBy: (transaction, { desc }) => [desc(transaction.id)],
                        limit,
                        where: {
                            deletedAt: { isNull: true },
                            consolidationParentTransactionId: { isNull: true },
                            ...(isDefined(cursorId) && { id: { lt: cursorId } })
                        }
                    })
                ),

            findByIds: (ids: number[]) => findByIdsWithEntriesWhere(ids, transactionFilters.ledgerEntryFilter),

            findByIdsWithRefundConsolidationHistory: (ids: number[]) => findByIdsWithEntriesWhere(ids, NOT_DELETED_ENTRY_RELATION_WHERE),

            findIdMapByExternalSource: Effect.fn('TransactionRepository.findIdMapByExternalSource')(function* (
                externalSource: ExternalSourceEnum,
                accountIds?: readonly number[]
            ) {
                if (isDefined(accountIds) && isEmptyArray(accountIds)) {
                    return new Map<string, number>();
                }

                const results = yield* Db.query(db =>
                    db
                        .select({ id: TransactionEntityTable.id, externalId: TransactionEntityTable.externalId })
                        .from(TransactionEntityTable)
                        .where(
                            and(
                                eq(TransactionEntityTable.externalSource, externalSource),
                                isNotNull(TransactionEntityTable.externalId),
                                isNull(TransactionEntityTable.deletedAt),
                                ...(isDefined(accountIds)
                                    ? [
                                          or(
                                              inArray(TransactionEntityTable.fromAccountId, [...accountIds]),
                                              inArray(TransactionEntityTable.toAccountId, [...accountIds])
                                          )
                                      ]
                                    : [])
                            )
                        )
                );

                return new Map(
                    results.flatMap(({ id, externalId }) => {
                        if (!isDefined(externalId)) {
                            return [];
                        }

                        return [[externalId, id] as const];
                    })
                );
            }),

            getTransactionTimeByAccountId: Effect.fn('TransactionRepository.getTransactionTimeByAccountId')(function* (
                accountId: number,
                mode: 'latest' | 'earliest'
            ) {
                const aggregateSql =
                    mode === 'latest'
                        ? sql<number | null>`MAX(${TransactionEntityTable.operatedAt})`
                        : sql<number | null>`MIN(${TransactionEntityTable.operatedAt})`;

                return yield* selectOperatedAtTime(aggregateSql, and(...transactionFilters.buildAccountCondition([accountId])));
            }),

            archiveByAccountIds: Effect.fn('TransactionRepository.archiveByAccountIds')(function* (accountIds: number[]) {
                const ledgerEntryCondition = transactionFilters.buildLedgerEntryCondition();

                yield* Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ deletedAt: new Date() })
                        .where(
                            and(
                                or(
                                    inArray(TransactionEntityTable.toAccountId, accountIds),
                                    inArray(TransactionEntityTable.fromAccountId, accountIds)
                                ),
                                or(
                                    ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                                    notExists(
                                        db
                                            .select({ id: TransactionEntryEntityTable.id })
                                            .from(TransactionEntryEntityTable)
                                            .where(
                                                and(
                                                    eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
                                                    ledgerEntryCondition
                                                )
                                            )
                                    )
                                ),
                                isNull(TransactionEntityTable.deletedAt)
                            )
                        )
                );
            }),

            archiveByIds: Effect.fn('TransactionRepository.archiveByIds')(function* (transactionIds: number[]) {
                if (isNotEmptyArray(transactionIds)) {
                    yield* Db.query(db =>
                        db
                            .update(TransactionEntityTable)
                            .set({ deletedAt: new Date() })
                            .where(inArray(TransactionEntityTable.id, transactionIds))
                    );
                }
            }),

            findMccCategorySuggestions: (mccCategoryId: number, limit: number) =>
                Db.query(db =>
                    db.$client.unsafe<{ categoryId: number; count: number }>(
                        `WITH signals AS (
                SELECT me.category_id AS category_id
                FROM merchant_embeddings me
                INNER JOIN mcc_categories mcc ON mcc.full_description = me.mcc_description
                WHERE mcc.id = ? AND me.deleted_at IS NULL
                UNION ALL
                SELECT te.category_id
                FROM transaction_entries te
                INNER JOIN transactions t ON t.id = te.transaction_id
                WHERE te.mcc_category_id = ?
                  AND te.category_id IS NOT NULL
                  AND t.deleted_at IS NULL
                  AND te.deleted_at IS NULL
            )
            SELECT category_id AS categoryId, COUNT(*) AS count
            FROM signals
            WHERE category_id IS NOT NULL
            GROUP BY category_id
            ORDER BY COUNT(*) DESC
            LIMIT ?`,
                        [mccCategoryId, mccCategoryId, limit]
                    )
                ),

            findDeletedExternalIdsByExternalSource: Effect.fn('TransactionRepository.findDeletedExternalIdsByExternalSource')(function* (
                externalSource: ExternalSourceEnum,
                accountIds: readonly number[]
            ) {
                if (isEmptyArray(accountIds)) {
                    return [];
                }

                const results = yield* Db.query(db =>
                    db
                        .select({ externalId: TransactionEntityTable.externalId })
                        .from(TransactionEntityTable)
                        .where(
                            and(
                                eq(TransactionEntityTable.externalSource, externalSource),
                                isNotNull(TransactionEntityTable.externalId),
                                isNotNull(TransactionEntityTable.deletedAt),
                                or(
                                    inArray(TransactionEntityTable.fromAccountId, [...accountIds]),
                                    inArray(TransactionEntityTable.toAccountId, [...accountIds])
                                )
                            )
                        )
                );

                return results.map(row => row.externalId).filter(isDefined);
            }),

            findExternalIdsByExternalSource: (externalSource: ExternalSourceEnum) =>
                Db.query(db =>
                    db
                        .select({ externalId: TransactionEntityTable.externalId })
                        .from(TransactionEntityTable)
                        .where(
                            and(
                                eq(TransactionEntityTable.externalSource, externalSource),
                                isNotNull(TransactionEntityTable.externalId),
                                isNull(TransactionEntityTable.deletedAt)
                            )
                        )
                ).pipe(Effect.map(results => results.map(row => row.externalId).filter(isDefined))),

            touchUpdatedAt: (id: number) =>
                Db.query(db => db.update(TransactionEntityTable).set({ updatedAt: new Date() }).where(eq(TransactionEntityTable.id, id))),

            deleteById: (id: number) => Db.query(db => db.delete(TransactionEntityTable).where(eq(TransactionEntityTable.id, id))),

            findAllWithMccCategoryOffset: (limit: number, offset: number) =>
                Db.query(db =>
                    db.query.TransactionEntityTable.findMany({
                        with: ENTRIES_WITH_MCC_CATEGORY_RELATIONS,
                        orderBy: (transaction, { desc }) => [desc(transaction.id)],
                        limit,
                        offset,
                        where: { deletedAt: { isNull: true } }
                    })
                ),

            getByIdRaw: (id: number) => Db.query(db => db.query.TransactionEntityTable.findFirst({ where: { id } })),

            getByIdWithEntries: (id: number) =>
                Db.query(db =>
                    db.query.TransactionEntityTable.findFirst({
                        where: { id },
                        with: {
                            [TransactionAssociationEnum.ENTRIES]: {
                                where: transactionFilters.ledgerEntryFilter
                            }
                        }
                    })
                ),

            truncate: () => Db.query(db => db.delete(TransactionEntityTable)),

            restoreByAccountIds: (accountIds: number[]) =>
                Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ deletedAt: null })
                        .where(
                            or(
                                inArray(TransactionEntityTable.toAccountId, accountIds),
                                inArray(TransactionEntityTable.fromAccountId, accountIds)
                            )
                        )
                ),

            findTransfersForConversion: (accountId: number) =>
                Db.query(db =>
                    db.query.TransactionEntityTable.findMany({
                        where: {
                            type: TransactionTypeEnum.TRANSFER,
                            deletedAt: { isNull: true },
                            consolidationParentTransactionId: { isNull: true },
                            OR: [{ fromAccountId: accountId }, { toAccountId: accountId }]
                        },
                        with: {
                            [TransactionAssociationEnum.ENTRIES]: {
                                where: transactionFilters.ledgerEntryFilter
                            }
                        }
                    })
                ),

            deleteByAccountId: (accountId: number) =>
                Db.query(db =>
                    db
                        .delete(TransactionEntityTable)
                        .where(
                            and(
                                or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
                                ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
                            )
                        )
                ),

            convertTransfersFromAccountToIncome: (accountId: number) =>
                Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ type: TransactionTypeEnum.INCOME, fromAccountId: sql`NULL`, exchangeRate: 1 })
                        .where(
                            and(
                                eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                                eq(TransactionEntityTable.fromAccountId, accountId),
                                transactionFilters.buildVisibleTransactionCondition()
                            )
                        )
                ),

            convertTransfersToAccountToExpense: (accountId: number) =>
                Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ type: TransactionTypeEnum.EXPENSE, toAccountId: sql`NULL`, exchangeRate: 1 })
                        .where(
                            and(
                                eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                                eq(TransactionEntityTable.toAccountId, accountId),
                                transactionFilters.buildVisibleTransactionCondition()
                            )
                        )
                ),

            detachTransfersFromAccount: Effect.fn('TransactionRepository.detachTransfersFromAccount')(function* (accountId: number) {
                yield* Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ fromAccountId: sql`NULL` })
                        .where(
                            and(
                                eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                                eq(TransactionEntityTable.fromAccountId, accountId)
                            )
                        )
                );
                yield* Db.query(db =>
                    db
                        .update(TransactionEntityTable)
                        .set({ toAccountId: sql`NULL` })
                        .where(
                            and(
                                eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER),
                                eq(TransactionEntityTable.toAccountId, accountId)
                            )
                        )
                );
            }),

            countAllActive: () =>
                Db.query(db =>
                    db.select({ value: count() }).from(TransactionEntityTable).where(isNull(TransactionEntityTable.deletedAt))
                ).pipe(Effect.map(([row]) => row.value))
        };
    })
}) {
    static readonly layer = Layer.effect(TransactionRepository, TransactionRepository.make);
}
