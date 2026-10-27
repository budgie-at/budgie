import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { TransactionReceiptEntityTable } from '../table/transaction-receipt-entity.table';

import type { TransactionReceiptCreateEntityInterface } from '../entity/transaction-receipt-create-entity.interface';

export class TransactionReceiptRepository extends Context.Service<TransactionReceiptRepository>()(
    '@budgie/contracts/TransactionReceiptRepository',
    {
        make: Effect.succeed({
            findByFingerprint: (fingerprint: string) =>
                Db.query(db => db.query.TransactionReceiptEntityTable.findFirst({ where: { fingerprint } })),
            insert: (input: TransactionReceiptCreateEntityInterface) =>
                Db.query(db => db.insert(TransactionReceiptEntityTable).values(input).returning()).pipe(Effect.map(([receipt]) => receipt))
        })
    }
) {
    static readonly layer = Layer.effect(TransactionReceiptRepository, TransactionReceiptRepository.make);
}
