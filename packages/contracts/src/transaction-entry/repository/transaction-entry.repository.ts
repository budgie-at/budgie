import { and, asc, count, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';
import type { TransactionEntryUpdateInputInterface } from '../input/transaction-entry-update-input.interface';
import type { BaseValuationBucketUpdateInterface } from '../interface/base-valuation-bucket-update.interface';

export class TransactionEntryRepository extends Context.Service<TransactionEntryRepository>()(
    '@budgie/contracts/TransactionEntryRepository',
    {
        make: Effect.sync(() => {
            const buildPendingBaseValuationWhere = (baseInstrumentId: number) =>
                and(
                    or(
                        isNull(TransactionEntryEntityTable.baseInstrumentId),
                        sql`${TransactionEntryEntityTable.baseInstrumentId} != ${baseInstrumentId}`
                    ),
                    isNull(TransactionEntryEntityTable.deletedAt),
                    isNull(TransactionEntityTable.deletedAt),
                    isNull(AccountEntityTable.deletedAt)
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
                                    isNull(TransactionEntryEntityTable.originalTransactionId),
                                    isNull(TransactionEntryEntityTable.deletedAt)
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
                bulkCreate: Effect.fn('TransactionEntryRepository.bulkCreate')(function* (inputs: TransactionEntryCreateEntityInterface[]) {
                    return isNotEmptyArray(inputs)
                        ? yield* Db.query(db => db.insert(TransactionEntryEntityTable).values(inputs).returning())
                        : [];
                }),
                findPendingBaseValuationBuckets: Effect.fn('TransactionEntryRepository.findPendingBaseValuationBuckets')(function* (
                    baseInstrumentId: number
                ) {
                    const originalTransaction = alias(TransactionEntityTable, 'original_transaction');
                    const rateDateSql = sql<string>`date(COALESCE(${originalTransaction.operatedAt}, ${TransactionEntityTable.operatedAt}), 'unixepoch')`;

                    return yield* Db.query(db =>
                        db
                            .select({
                                rateDate: rateDateSql,
                                sourceInstrumentId: AccountEntityTable.instrumentId,
                                entryCount: count(TransactionEntryEntityTable.id)
                            })
                            .from(TransactionEntryEntityTable)
                            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                            .leftJoin(originalTransaction, eq(originalTransaction.id, TransactionEntryEntityTable.originalTransactionId))
                            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                            .where(buildPendingBaseValuationWhere(baseInstrumentId))
                            .groupBy(rateDateSql, AccountEntityTable.instrumentId)
                    );
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
                deleteByTransactionIds: Effect.fn('TransactionEntryRepository.deleteByTransactionIds')(function* (
                    transactionIds: number[]
                ) {
                    if (isNotEmptyArray(transactionIds)) {
                        yield* Db.query(db =>
                            db.delete(TransactionEntryEntityTable).where(inArray(TransactionEntryEntityTable.transactionId, transactionIds))
                        );
                    }
                }),
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
                countPendingBaseValuationEntries: (baseInstrumentId: number) =>
                    Db.query(db =>
                        db
                            .select({ count: count(TransactionEntryEntityTable.id) })
                            .from(TransactionEntryEntityTable)
                            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                            .where(buildPendingBaseValuationWhere(baseInstrumentId))
                    ).pipe(Effect.map(([row]) => row.count)),
                updateBaseValuationBucket: (input: BaseValuationBucketUpdateInterface) =>
                    Db.query(db =>
                        db.run(sql`
                        UPDATE transaction_entries
                        SET base_instrument_id = ${input.baseInstrumentId},
                            base_exchange_rate = ${input.baseExchangeRate},
                            base_amount = ROUND(amount * ${input.baseExchangeRate})
                        WHERE id IN (
                            SELECT te.id
                            FROM transaction_entries te
                            INNER JOIN transactions t ON t.id = te.transaction_id
                            LEFT JOIN transactions original_t ON original_t.id = te.original_transaction_id
                            INNER JOIN accounts a ON a.id = te.account_id
                            WHERE date(COALESCE(original_t.operated_at, t.operated_at), 'unixepoch') = ${input.rateDate}
                              AND a.instrument_id = ${input.sourceInstrumentId}
                              AND te.deleted_at IS NULL
                              AND t.deleted_at IS NULL
                              AND a.deleted_at IS NULL
                              AND (
                                te.base_amount IS NULL
                                OR te.base_exchange_rate IS NULL
                                OR te.base_instrument_id IS NULL
                                OR te.base_instrument_id != ${input.baseInstrumentId}
                              )
                        )
                    `)
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
                deleteLedgerByTransactionId: (transactionId: number) =>
                    Db.query(db =>
                        db
                            .delete(TransactionEntryEntityTable)
                            .where(
                                and(
                                    eq(TransactionEntryEntityTable.transactionId, transactionId),
                                    isNull(TransactionEntryEntityTable.originalTransactionId)
                                )
                            )
                    ),
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
