import { eq } from 'drizzle-orm';

import { DB, TX } from '../../generic/type/db.type';
import { TransactionToTagCreateEntityInterface } from '../entity/transaction-to-tag-create-entity.interface';
import { TransactionToTagEntityInterface } from '../entity/transaction-to-tag-entity.interface';
import { TransactionToTagEntityTable } from '../table/transaction-to-tag-entity.table';

export class TransactionToTagRepository {
    constructor(private db: DB) {}

    async create(input: TransactionToTagCreateEntityInterface, tx?: TX): Promise<TransactionToTagEntityInterface> {
        const [relation] = await (tx ?? this.db).insert(TransactionToTagEntityTable).values([input]).returning();

        return relation;
    }

    async findByTransactionId(id: number): Promise<TransactionToTagEntityInterface[]> {
        return await this.db.query.TransactionToTagEntityTable.findMany({ where: eq(TransactionToTagEntityTable.transactionId, id) });
    }
}
