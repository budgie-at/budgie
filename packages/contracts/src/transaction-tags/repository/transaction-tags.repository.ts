import { eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionTagsCreateEntityInterface } from '../entity/transaction-tags-create-entity.interface';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';
import { insertTransactionTag } from '../util/insert-transaction-tag.util';

export class TransactionTagsRepository {
    readonly findByTransactionId = Effect.fn('TransactionTagsRepository.findByTransactionId')(function* (transactionId: number) {
        return yield* Db.query(db =>
            db.select().from(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, transactionId))
        );
    });

    readonly findByTransactionIds = Effect.fn('TransactionTagsRepository.findByTransactionIds')(function* (
        transactionIds: readonly number[]
    ) {
        if (!isNotEmptyArray(transactionIds)) {
            return [];
        }

        return yield* Db.query(db =>
            db.select().from(TransactionTagsEntityTable).where(inArray(TransactionTagsEntityTable.transactionId, transactionIds))
        );
    });

    readonly bulkCreate = Effect.fn('TransactionTagsRepository.bulkCreate')(function* (inputs: TransactionTagsCreateEntityInterface[]) {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        return yield* Db.query(db => db.insert(TransactionTagsEntityTable).values(inputs).returning());
    });

    readonly addTagByTransactionIds = Effect.fn('TransactionTagsRepository.addTagByTransactionIds')(function* (
        transactionIds: number[],
        tagId: number
    ) {
        if (!isNotEmptyArray(transactionIds)) {
            return [];
        }

        const rows = yield* Db.query(db => insertTransactionTag(db, tagId, inArray(TransactionEntityTable.id, transactionIds)));

        return rows.map(row => row.transactionId);
    });

    readonly deleteByTransactionId = Effect.fn('TransactionTagsRepository.deleteByTransactionId')(function* (id: number) {
        yield* Db.query(db => db.delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, id)));
    });

    readonly truncate = Effect.fn('TransactionTagsRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(TransactionTagsEntityTable));
    });
}
