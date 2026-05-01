import { and, count, eq, isNull } from 'drizzle-orm';

import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

import type { DB } from '../../@generic/type/db.type';

export class TransactionEmbeddingRepository {
    constructor(private readonly db: DB) {}

    async countPending(tx?: DB): Promise<number> {
        const [row] = await (tx ?? this.db)
            .select({ value: count() })
            .from(TransactionEntityTable)
            .where(and(eq(TransactionEntityTable.needsEmbedding, true), isNull(TransactionEntityTable.deletedAt)));

        return row.value;
    }
}
