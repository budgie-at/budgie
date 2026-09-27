import { eq, inArray } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionTagsCreateEntityInterface } from '../entity/transaction-tags-create-entity.interface';
import { TransactionTagsEntityInterface } from '../entity/transaction-tags-entity.interface';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';
import { insertTransactionTag } from '../util/insert-transaction-tag.util';

import type { DB } from '../../@generic/type/db.type';

export class TransactionTagsRepository {
    constructor(private db: DB) {}

    async findByTransactionId(transactionId: number, tx?: DB): Promise<TransactionTagsEntityInterface[]> {
        return await (tx ?? this.db)
            .select()
            .from(TransactionTagsEntityTable)
            .where(eq(TransactionTagsEntityTable.transactionId, transactionId));
    }

    async findByTransactionIds(transactionIds: readonly number[], tx?: DB): Promise<TransactionTagsEntityInterface[]> {
        if (!isNotEmptyArray(transactionIds)) {
            return [];
        }

        return await (tx ?? this.db)
            .select()
            .from(TransactionTagsEntityTable)
            .where(inArray(TransactionTagsEntityTable.transactionId, transactionIds));
    }

    async bulkCreate(inputs: TransactionTagsCreateEntityInterface[], tx?: DB): Promise<TransactionTagsEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionTagsEntityTable).values(inputs).returning();
        }

        return [];
    }

    async addTagByTransactionIds(transactionIds: number[], tagId: number, tx?: DB): Promise<number[]> {
        if (!isNotEmptyArray(transactionIds)) {
            return [];
        }

        const rows = await insertTransactionTag(tx ?? this.db, tagId, inArray(TransactionEntityTable.id, transactionIds));

        return rows.map(row => row.transactionId);
    }

    async deleteByTransactionId(id: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, id));
    }

    async truncate(): Promise<void> {
        await this.db.delete(TransactionTagsEntityTable);
    }
}
