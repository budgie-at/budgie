import { and, count, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { Db } from '../../@generic/service/db.service';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

export class TransactionEmbeddingRepository {
    readonly countPending = Effect.fn('TransactionEmbeddingRepository.countPending')(function* () {
        const [row] = yield* Db.query(db =>
            db
                .select({ value: count() })
                .from(TransactionEntityTable)
                .where(and(eq(TransactionEntityTable.needsEmbedding, true), isNull(TransactionEntityTable.deletedAt)))
        );

        return row.value;
    });
}
