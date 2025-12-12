import { eq } from 'drizzle-orm';

import { DB, TX } from '../../generic/type/db.type';
import { TransactionTagsCreateEntityInterface } from '../entity/transaction-tags-create-entity.interface';
import { TransactionTagsEntityInterface } from '../entity/transaction-tags-entity.interface';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export class TransactionTagsRepository {
    constructor(private db: DB) {}

    async create(input: TransactionTagsCreateEntityInterface, tx?: TX): Promise<TransactionTagsEntityInterface> {
        const [relation] = await (tx ?? this.db).insert(TransactionTagsEntityTable).values([input]).returning();

        return relation;
    }

    async findByTransactionId(id: number): Promise<TransactionTagsEntityInterface[]> {
        return await this.db.query.TransactionTagsEntityTable.findMany({ where: eq(TransactionTagsEntityTable.transactionId, id) });
    }
}
