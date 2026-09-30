import { and, count, isNull, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { Db } from '../../@generic/service/db.service';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

export class TransactionEmbeddingRepository {
    readonly countPending = () =>
        Db.query(db =>
            db
                .select({ value: count() })
                .from(TransactionEntityTable)
                .where(and(sql`${TransactionEntityTable.needsEmbedding} = 1`, isNull(TransactionEntityTable.deletedAt)))
        ).pipe(Effect.map(([row]) => row.value));
}
