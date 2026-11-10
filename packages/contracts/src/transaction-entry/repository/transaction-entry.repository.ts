import { and, asc, eq, exists, gte, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { deriveSeedSyncId } from '../../cloud-sync/utils/derive-seed-sync-id.util';
import { DebtEventSourceEnum } from '../../debt-event/enum/debt-event-source.enum';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { CategorySourceEnum } from '../enum/category-source.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import type { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';
import type { TransactionEntryUpdateInputInterface } from '../input/transaction-entry-update-input.interface';
import type { SQL } from 'drizzle-orm';

export class TransactionEntryRepository extends Context.Service<TransactionEntryRepository>()(
    '@budgie/contracts/TransactionEntryRepository',
    {
        make: Effect.sync(() => {
            const queryBuilder = new QueryBuilder();

            const deleteLiveEntries = (...conditions: SQL[]) =>
                Db.query(db =>
                    db
                        .delete(TransactionEntryEntityTable)
                        .where(and(isNull(TransactionEntryEntityTable.originalTransactionId), ...conditions))
                );

            return {
                moveToConsolidatedTransaction: Effect.fn('TransactionEntryRepository.moveToConsolidatedTransaction')(function* (
                    sourceTransactionIds: number[],
                    canonicalTransactionId: number
                ) {
                    if (!isNotEmptyArray(sourceTransactionIds)) {
                        return;
                    }
                    yield* Db.query(db =>
                        db
                            .update(TransactionEntryEntityTable)
                            .set({
                                originalTransactionId: TransactionEntryEntityTable.transactionId,
                                transactionId: canonicalTransactionId
                            })
                            .where(
                                and(
                                    inArray(TransactionEntryEntityTable.transactionId, sourceTransactionIds),
                                    transactionFilters.buildLedgerEntryCondition()
                                )
                            )
                    );
                }),
                hasMovedSourceEntries: Effect.fn('TransactionEntryRepository.hasMovedSourceEntries')(function* (transactionIds: number[]) {
                    if (!isNotEmptyArray(transactionIds)) {
                        return false;
                    }
                    const [entry] = yield* Db.query(db =>
                        db
                            .select({ id: TransactionEntryEntityTable.id })
                            .from(TransactionEntryEntityTable)
                            .where(
                                and(
                                    inArray(TransactionEntryEntityTable.transactionId, transactionIds),
                                    isNotNull(TransactionEntryEntityTable.originalTransactionId),
                                    isNull(TransactionEntryEntityTable.deletedAt)
                                )
                            )
                            .limit(1)
                    );

                    return isDefined(entry);
                }),
                findTransactionIdsWithLiveEntries: Effect.fn('TransactionEntryRepository.findTransactionIdsWithLiveEntries')(function* (
                    transactionIds: number[]
                ) {
                    if (!isNotEmptyArray(transactionIds)) {
                        return new Set<number>();
                    }
                    const entries = yield* Db.query(db =>
                        db
                            .select({
                                transactionId: TransactionEntryEntityTable.transactionId,
                                originalTransactionId: TransactionEntryEntityTable.originalTransactionId
                            })
                            .from(TransactionEntryEntityTable)
                            .where(
                                and(
                                    or(
                                        inArray(TransactionEntryEntityTable.transactionId, transactionIds),
                                        inArray(TransactionEntryEntityTable.originalTransactionId, transactionIds)
                                    ),
                                    isNull(TransactionEntryEntityTable.deletedAt)
                                )
                            )
                    );

                    return new Set(entries.flatMap(entry => [entry.transactionId, entry.originalTransactionId]).filter(isDefined));
                }),
                bulkCreate: Effect.fn('TransactionEntryRepository.bulkCreate')(function* (inputs: TransactionEntryCreateEntityInterface[]) {
                    return isNotEmptyArray(inputs)
                        ? yield* Db.query(db => db.insert(TransactionEntryEntityTable).values(inputs).returning())
                        : [];
                }),
                updateById: Effect.fn('TransactionEntryRepository.updateById')(function* (
                    id: number,
                    input: TransactionEntryUpdateInputInterface
                ) {
                    const [transactionEntry] = yield* Db.query(db =>
                        db.update(TransactionEntryEntityTable).set(input).where(eq(TransactionEntryEntityTable.id, id)).returning()
                    );
                    if (!isDefined(transactionEntry)) {
                        return yield* Effect.die(new Error(`Transaction entry ${id} not found`));
                    }

                    return transactionEntry;
                }),
                findByExternalIdsAndAccountId: Effect.fn('TransactionEntryRepository.findByExternalIdsAndAccountId')(function* (
                    externalIds: string[],
                    accountId: number
                ) {
                    return isNotEmptyArray(externalIds)
                        ? yield* Db.query(db =>
                              db
                                  .select()
                                  .from(TransactionEntryEntityTable)
                                  .where(
                                      and(
                                          inArray(TransactionEntryEntityTable.externalId, externalIds),
                                          eq(TransactionEntryEntityTable.accountId, accountId),
                                          isNull(TransactionEntryEntityTable.deletedAt)
                                      )
                                  )
                                  .orderBy(asc(TransactionEntryEntityTable.id))
                          )
                        : [];
                }),
                deleteLedgerByTransactionIds: (transactionIds: number[]) =>
                    Db.query(db =>
                        db
                            .delete(TransactionEntryEntityTable)
                            .where(
                                and(
                                    inArray(TransactionEntryEntityTable.transactionId, transactionIds),
                                    transactionFilters.buildLedgerEntryCondition()
                                )
                            )
                    ),
                moveBackToOriginalTransactions: (canonicalTransactionId: number) =>
                    Db.query(db =>
                        db
                            .update(TransactionEntryEntityTable)
                            .set({ transactionId: TransactionEntryEntityTable.originalTransactionId, originalTransactionId: null })
                            .where(
                                and(
                                    eq(TransactionEntryEntityTable.transactionId, canonicalTransactionId),
                                    isNotNull(TransactionEntryEntityTable.originalTransactionId),
                                    isNull(TransactionEntryEntityTable.deletedAt)
                                )
                            )
                    ),
                create: (input: TransactionEntryCreateEntityInterface) =>
                    Db.query(db => db.insert(TransactionEntryEntityTable).values([input]).returning()).pipe(
                        Effect.map(([transactionEntry]) => transactionEntry)
                    ),
                findByTransactionIdAndExternalId: (transactionId: number, externalId: string) =>
                    Db.query(db =>
                        db.query.TransactionEntryEntityTable.findFirst({
                            where: {
                                externalId,
                                OR: [{ transactionId }, { originalTransactionId: transactionId }],
                                deletedAt: { isNull: true }
                            }
                        })
                    ),
                updateByExternalIdAndAccountId: (externalId: string, accountId: number, input: TransactionEntryUpdateInputInterface) =>
                    Db.query(db =>
                        db
                            .update(TransactionEntryEntityTable)
                            .set(input)
                            .where(
                                and(
                                    eq(TransactionEntryEntityTable.externalId, externalId),
                                    eq(TransactionEntryEntityTable.accountId, accountId),
                                    isNull(TransactionEntryEntityTable.deletedAt)
                                )
                            )
                            .returning()
                    ).pipe(Effect.map(transactionEntries => transactionEntries.at(0))),
                assignDebtPaymentCategory: (seedKey: string, debtType: AccountDebtTypeEnum) => {
                    const seedSyncId = deriveSeedSyncId(seedKey);
                    const zoneCategoryId = sql<number>`(SELECT ${CategoryEntityTable.id} FROM ${CategoryEntityTable} WHERE ${CategoryEntityTable.syncZone} = ${TransactionEntryEntityTable.syncZone} AND ${CategoryEntityTable.syncId} = ${seedSyncId} AND ${CategoryEntityTable.deletedAt} IS NULL)`;

                    return Db.query(db =>
                        db
                            .update(TransactionEntryEntityTable)
                            .set({ categoryId: zoneCategoryId, categorySource: CategorySourceEnum.DEBT_SETTLEMENT })
                            .where(
                                and(
                                    inArray(
                                        TransactionEntryEntityTable.id,
                                        queryBuilder
                                            .select({ id: DebtEventEntityTable.transactionEntryId })
                                            .from(DebtEventEntityTable)
                                            .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, DebtEventEntityTable.debtAccountId))
                                            .innerJoin(
                                                TransactionEntityTable,
                                                eq(TransactionEntityTable.id, DebtEventEntityTable.transactionId)
                                            )
                                            .where(
                                                and(
                                                    eq(DebtEventEntityTable.source, DebtEventSourceEnum.INCOME_ATTACHMENT),
                                                    isNotNull(DebtEventEntityTable.transactionEntryId),
                                                    isNull(DebtEventEntityTable.deletedAt),
                                                    isNull(TransactionEntityTable.deletedAt),
                                                    eq(AccountEntityTable.debtType, debtType)
                                                )
                                            )
                                    ),
                                    transactionFilters.buildCategorizableEntryCondition(),
                                    exists(
                                        queryBuilder
                                            .select({ id: CategoryEntityTable.id })
                                            .from(CategoryEntityTable)
                                            .where(
                                                and(
                                                    eq(CategoryEntityTable.syncZone, TransactionEntryEntityTable.syncZone),
                                                    eq(CategoryEntityTable.syncId, seedSyncId),
                                                    isNull(CategoryEntityTable.deletedAt)
                                                )
                                            )
                                    ),
                                    or(
                                        isNull(TransactionEntryEntityTable.categoryId),
                                        inArray(TransactionEntryEntityTable.categorySource, [
                                            CategorySourceEnum.MCC_DEFAULT,
                                            CategorySourceEnum.AI
                                        ])
                                    )
                                )
                            )
                    );
                },
                deleteByTransactionId: (transactionId: number) =>
                    Db.query(db =>
                        db.delete(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId))
                    ),
                deleteLedgerByTransactionIdAndAccountId: (transactionId: number, accountId: number) =>
                    deleteLiveEntries(
                        eq(TransactionEntryEntityTable.transactionId, transactionId),
                        eq(TransactionEntryEntityTable.accountId, accountId)
                    ),
                deleteLedgerByTransactionId: (transactionId: number) =>
                    deleteLiveEntries(eq(TransactionEntryEntityTable.transactionId, transactionId)),
                truncate: Db.query(db => db.delete(TransactionEntryEntityTable)),
                archiveByAccountIds: (accountIds: number[]) =>
                    Db.query(db =>
                        db
                            .update(TransactionEntryEntityTable)
                            .set({ deletedAt: new Date() })
                            .where(
                                and(
                                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                                    isNull(TransactionEntryEntityTable.deletedAt)
                                )
                            )
                    ),
                restoreByAccountIds: (accountIds: number[], archivedAt: Date) =>
                    Db.query(db =>
                        db
                            .update(TransactionEntryEntityTable)
                            .set({ deletedAt: null })
                            .where(
                                and(
                                    inArray(TransactionEntryEntityTable.accountId, accountIds),
                                    gte(TransactionEntryEntityTable.deletedAt, archivedAt)
                                )
                            )
                    ),
                deleteByAccountId: (accountId: number) =>
                    Db.query(db => db.delete(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId)))
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionEntryRepository, TransactionEntryRepository.make);
}
