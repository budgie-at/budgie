import { eq, inArray } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { TransactionEntryEntityInterface } from '../entity/transaction-entry-entity.interface';

export class TransactionEntryRepository {
    constructor(private db: DB) {}

    async bulkCreate(inputs: TransactionEntryCreateEntityInterface[], tx?: DB): Promise<TransactionEntryEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionEntryEntityTable).values(inputs).returning();
        }

        return [];
    }

    async create(input: TransactionEntryCreateEntityInterface, tx?: DB): Promise<TransactionEntryEntityInterface> {
        const [transactionEntry] = await (tx ?? this.db).insert(TransactionEntryEntityTable).values([input]).returning();

        return transactionEntry;
    }

    async deleteByTransactionId(transactionId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId));
    }

    async deleteByTransactionIds(transactionIds: number[], tx?: DB): Promise<void> {
        if (isNotEmptyArray(transactionIds)) {
            await (tx ?? this.db)
                .delete(TransactionEntryEntityTable)
                .where(inArray(TransactionEntryEntityTable.transactionId, transactionIds));
        }
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntryEntityTable);
    }

    async archiveByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: new Date() })
            .where(inArray(TransactionEntryEntityTable.accountId, accountIds));
    }

    async restoreByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: null })
            .where(inArray(TransactionEntryEntityTable.accountId, accountIds));
    }

    async deleteByAccountId(accountId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId));
    }
}
