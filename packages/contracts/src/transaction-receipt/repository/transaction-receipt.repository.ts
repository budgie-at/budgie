import { and, eq, notExists } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { TransactionReceiptEntityTable } from '../table/transaction-receipt-entity.table';

import type { TransactionReceiptCreateEntityInterface } from '../entity/transaction-receipt-create-entity.interface';

export class TransactionReceiptRepository extends Context.Service<TransactionReceiptRepository>()(
    '@budgie/contracts/TransactionReceiptRepository',
    {
        make: Effect.sync(() => {
            const targetReceipt = alias(TransactionReceiptEntityTable, 'target_receipt');

            return {
                findByFingerprint: (fingerprint: string) =>
                    Db.query(db =>
                        db
                            .select()
                            .from(TransactionReceiptEntityTable)
                            .where(eq(TransactionReceiptEntityTable.fingerprint, fingerprint))
                            .limit(1)
                    ).pipe(Effect.map(receipts => receipts.at(0))),
                findByTransactionId: (transactionId: number) =>
                    Db.query(db =>
                        db
                            .select()
                            .from(TransactionReceiptEntityTable)
                            .where(eq(TransactionReceiptEntityTable.transactionId, transactionId))
                            .limit(1)
                    ).pipe(Effect.map(receipts => receipts.at(0))),
                insert: (input: TransactionReceiptCreateEntityInterface) =>
                    Db.query(db => db.insert(TransactionReceiptEntityTable).values(input).returning()).pipe(
                        Effect.map(([receipt]) => receipt)
                    ),
                moveToTransaction: (fromTransactionId: number, toTransactionId: number) =>
                    Db.query(db =>
                        db
                            .update(TransactionReceiptEntityTable)
                            .set({ transactionId: toTransactionId })
                            .where(
                                and(
                                    eq(TransactionReceiptEntityTable.transactionId, fromTransactionId),
                                    notExists(
                                        db
                                            .select({ transactionId: targetReceipt.transactionId })
                                            .from(targetReceipt)
                                            .where(eq(targetReceipt.transactionId, toTransactionId))
                                    )
                                )
                            )
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionReceiptRepository, TransactionReceiptRepository.make);
}
