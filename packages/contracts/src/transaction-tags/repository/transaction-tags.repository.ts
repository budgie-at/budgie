import { and, eq, inArray } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionTagsCreateEntityInterface } from '../entity/transaction-tags-create-entity.interface';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';
import { insertTransactionTag } from '../util/insert-transaction-tag.util';

export class TransactionTagsRepository extends Context.Service<TransactionTagsRepository>()('@budgie/contracts/TransactionTagsRepository', {
    make: Effect.succeed({
        findByTransactionIds: Effect.fn('TransactionTagsRepository.findByTransactionIds')(function* (transactionIds: readonly number[]) {
            if (!isNotEmptyArray(transactionIds)) {
                return [];
            }

            return yield* Db.query(db =>
                db.select().from(TransactionTagsEntityTable).where(inArray(TransactionTagsEntityTable.transactionId, transactionIds))
            );
        }),

        bulkCreate: Effect.fn('TransactionTagsRepository.bulkCreate')(function* (inputs: TransactionTagsCreateEntityInterface[]) {
            if (!isNotEmptyArray(inputs)) {
                return [];
            }

            return yield* Db.query(db => db.insert(TransactionTagsEntityTable).values(inputs).returning());
        }),

        addTagByTransactionIds: Effect.fn('TransactionTagsRepository.addTagByTransactionIds')(function* (
            transactionIds: number[],
            tagId: number
        ) {
            if (!isNotEmptyArray(transactionIds)) {
                return [];
            }

            const rows = yield* Db.query(db => insertTransactionTag(db, tagId, inArray(TransactionEntityTable.id, transactionIds)));

            return rows.map(row => row.transactionId);
        }),

        findByTransactionId: (transactionId: number) =>
            Db.query(db => db.select().from(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, transactionId))),

        deleteByTransactionIdAndTagIds: Effect.fn('TransactionTagsRepository.deleteByTransactionIdAndTagIds')(function* (
            transactionId: number,
            tagIds: readonly number[]
        ) {
            if (!isNotEmptyArray(tagIds)) {
                return;
            }

            yield* Db.query(db =>
                db
                    .delete(TransactionTagsEntityTable)
                    .where(
                        and(eq(TransactionTagsEntityTable.transactionId, transactionId), inArray(TransactionTagsEntityTable.tagId, tagIds))
                    )
            );
        }),

        deleteByTransactionId: (id: number) =>
            Db.query(db => db.delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, id))),

        truncate: () => Db.query(db => db.delete(TransactionTagsEntityTable))
    })
}) {
    static readonly layer = Layer.effect(TransactionTagsRepository, TransactionTagsRepository.make);
}
