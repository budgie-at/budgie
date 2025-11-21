import { eq } from 'drizzle-orm';

import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';
import { TransactionEntryAssociationEnum } from '../enum/transaction-entry-association.enum';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { TransactionEntryEntityInterface } from '../entity/transaction-entry-entity.interface';

export class TransactionEntryRepository {
    constructor(private db: DB) {}

    async create(input: TransactionEntryCreateEntityInterface, tx?: TX): Promise<TransactionEntryEntityInterface> {
        const [transactionEntry] = await (tx ?? this.db).insert(TransactionEntryEntityTable).values([input]).returning();

        return transactionEntry;
    }

    async deleteById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.id, id));
    }

    getAll(limit?: number) {
        return this.db.query.TransactionEntryEntityTable.findMany({
            with: {
                [TransactionEntryAssociationEnum.CATEGORY]: true,
                [TransactionEntryAssociationEnum.ACCOUNT]: true,
                [TransactionEntryAssociationEnum.TRANSACTION]: true
            },
            orderBy: (entries, { desc }) => [desc(entries.id)],
            limit
        });
    }

    findByType(type: TransactionEntryTypeEnum) {
        return this.db.query.TransactionEntryEntityTable.findMany({
            where: eq(TransactionEntryEntityTable.type, type)
        });
    }

    findById(id: number) {
        return this.db.query.TransactionEntryEntityTable.findFirst({
            where: eq(TransactionEntryEntityTable.id, id),
            with: { [TransactionEntryAssociationEnum.CATEGORY]: true }
        });
    }

    findByTransactionId(id: number) {
        return this.db.query.TransactionEntryEntityTable.findFirst({
            where: eq(TransactionEntryEntityTable.transactionId, id),
            with: { [TransactionEntryAssociationEnum.CATEGORY]: true }
        });
    }
}
