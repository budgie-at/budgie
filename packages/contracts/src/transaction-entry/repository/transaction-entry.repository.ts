import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { TransactionEntryEntityInterface } from '../entity/transaction-entry-entity.interface';

export class TransactionEntryRepository {
    constructor(private db: DB) {}

    async create(input: TransactionEntryCreateEntityInterface, tx?: TX): Promise<TransactionEntryEntityInterface> {
        const [transactionEntry] = await (tx ?? this.db).insert(TransactionEntryEntityTable).values([input]).returning();

        return transactionEntry;
    }
}
