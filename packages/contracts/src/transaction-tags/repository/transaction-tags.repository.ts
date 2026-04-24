import { and, eq } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { TransactionTagsCreateEntityInterface } from '../entity/transaction-tags-create-entity.interface';
import { TransactionTagsEntityInterface } from '../entity/transaction-tags-entity.interface';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export class TransactionTagsRepository {
    constructor(private db: DB) {}

    async bulkCreate(inputs: TransactionTagsCreateEntityInterface[], tx?: DB): Promise<TransactionTagsEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionTagsEntityTable).values(inputs).returning();
        }

        return [];
    }

    async deleteByTransactionId(id: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, id));
    }

    async findPrimaryByTransactionId(transactionId: number, tx?: DB): Promise<TransactionTagsEntityInterface | undefined> {
        const [row] = await (tx ?? this.db)
            .select()
            .from(TransactionTagsEntityTable)
            .where(and(eq(TransactionTagsEntityTable.transactionId, transactionId), eq(TransactionTagsEntityTable.isPrimary, true)))
            .limit(1);

        return row;
    }

    async setPrimary(transactionId: number, tagId: number, tx?: DB): Promise<void> {
        const connection = tx ?? this.db;

        await connection
            .update(TransactionTagsEntityTable)
            .set({ isPrimary: false })
            .where(eq(TransactionTagsEntityTable.transactionId, transactionId));

        await connection
            .update(TransactionTagsEntityTable)
            .set({ isPrimary: true })
            .where(and(eq(TransactionTagsEntityTable.transactionId, transactionId), eq(TransactionTagsEntityTable.tagId, tagId)));
    }

    async truncate(): Promise<void> {
        await this.db.delete(TransactionTagsEntityTable);
    }
}
