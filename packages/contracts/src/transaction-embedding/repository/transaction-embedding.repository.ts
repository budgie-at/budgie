import { and, count, eq, isNull } from 'drizzle-orm';

import { TRANSACTION_FULL_RELATIONS } from '../../transaction/constant/transaction-relations.constant';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { PendingEmbeddingRowInterface } from '../interface/pending-embedding-row.interface';

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

    async findPending(limit: number, tx?: DB): Promise<PendingEmbeddingRowInterface[]> {
        return (tx ?? this.db).query.TransactionEntityTable.findMany({
            where: and(eq(TransactionEntityTable.needsEmbedding, true), isNull(TransactionEntityTable.deletedAt)),
            orderBy: (transaction, { asc }) => [asc(transaction.id)],
            limit,
            with: TRANSACTION_FULL_RELATIONS
        });
    }
}
