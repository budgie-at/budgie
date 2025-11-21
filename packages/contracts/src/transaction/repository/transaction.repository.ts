import { eq } from 'drizzle-orm';

import { DB, TX } from '../../generic/type/db.type';
import { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';

export class TransactionRepository {
    constructor(private db: DB) {}

    async create(input: TransactionCreateEntityInterface, tx?: TX): Promise<TransactionEntityInterface> {
        const [transaction] = await (tx ?? this.db).insert(TransactionEntityTable).values([input]).returning();

        return transaction;
    }

    async deleteById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntityTable).where(eq(TransactionEntityTable.id, id));
    }

    getAll() {
        return this.db.query.TransactionEntityTable.findMany({
            with: { [TransactionAssociationEnum.ENTRIES]: true }
        });
    }

    findByType(type: TransactionTypeEnum) {
        return this.db.query.TransactionEntityTable.findMany({
            where: eq(TransactionEntityTable.type, type)
        });
    }

    findById(id: number) {
        return this.db.query.TransactionEntityTable.findFirst({
            where: eq(TransactionEntityTable.id, id),
            with: { [TransactionAssociationEnum.ENTRIES]: true }
        });
    }
}
