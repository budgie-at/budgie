import { and, asc, eq, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';
import type { TransactionEntryUpdateInputInterface } from '../input/transaction-entry-update-input.interface';
import type { SQL } from 'drizzle-orm';

export class TransactionEntryRepository extends Context.Service<TransactionEntryRepository>()(
    '@budgie/contracts/TransactionEntryRepository',
    {
        make: Effect.sync(() => {
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
                truncate: () => Db.query(db => db.delete(TransactionEntryEntityTable)),
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
                restoreByAccountIds: (accountIds: number[]) =>
                    Db.query(db =>
                        db
                            .update(TransactionEntryEntityTable)
                            .set({ deletedAt: null })
                            .where(inArray(TransactionEntryEntityTable.accountId, accountIds))
                    ),
                deleteByAccountId: (accountId: number) =>
                    Db.query(db => db.delete(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId)))
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionEntryRepository, TransactionEntryRepository.make);
}
