import { eq } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB, DBOrTX } from '../../@generic/type/db.type';
import { TransactionTagsCreateEntityInterface } from '../entity/transaction-tags-create-entity.interface';
import { TransactionTagsEntityInterface } from '../entity/transaction-tags-entity.interface';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export class TransactionTagsRepository {
    constructor(private db: DB) {}

    async bulkCreate(inputs: TransactionTagsCreateEntityInterface[], tx?: DBOrTX): Promise<TransactionTagsEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionTagsEntityTable).values(inputs).onConflictDoNothing().returning();
        }

        return [];
    }

    async deleteByTransactionId(id: number, tx?: DBOrTX): Promise<void> {
        await (tx ?? this.db).delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, id));
    }

    async truncate(): Promise<void> {
        await this.db.delete(TransactionTagsEntityTable);
    }
}
