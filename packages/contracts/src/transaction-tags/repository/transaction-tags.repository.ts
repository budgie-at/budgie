import { eq } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB, TX } from '../../@generic/type/db.type';
import { TransactionTagsCreateEntityInterface } from '../entity/transaction-tags-create-entity.interface';
import { TransactionTagsEntityInterface } from '../entity/transaction-tags-entity.interface';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export class TransactionTagsRepository {
    constructor(private db: DB) {}

    async findByTransactionId(transactionId: number, tx?: TX): Promise<TransactionTagsEntityInterface[]> {
        return await (tx ?? this.db)
            .select()
            .from(TransactionTagsEntityTable)
            .where(eq(TransactionTagsEntityTable.transactionId, transactionId));
    }

    async bulkCreate(inputs: TransactionTagsCreateEntityInterface[], tx?: TX): Promise<TransactionTagsEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionTagsEntityTable).values(inputs).returning();
        }

        return [];
    }

    async deleteByTransactionId(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, id));
    }

    async truncate(): Promise<void> {
        await this.db.delete(TransactionTagsEntityTable);
    }
}
