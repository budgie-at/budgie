import { and, eq, inArray, isNull } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DebtEventEntityTable } from '../table/debt-event-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { DebtEventCreateEntityInterface } from '../entity/debt-event-create-entity.interface';
import type { DebtEventEntityInterface } from '../entity/debt-event-entity.interface';
import type { DebtEventSourceEnum } from '../enum/debt-event-source.enum';

export class DebtEventRepository {
    constructor(private db: DB) {}

    async create(input: DebtEventCreateEntityInterface, tx?: DB): Promise<DebtEventEntityInterface> {
        const [debtEvent] = await this.bulkCreate([input], tx);

        return debtEvent;
    }

    async bulkCreate(inputs: DebtEventCreateEntityInterface[], tx?: DB): Promise<DebtEventEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        return await (tx ?? this.db).insert(DebtEventEntityTable).values(inputs).returning();
    }

    async findByTransactionId(transactionId: number, tx?: DB): Promise<DebtEventEntityInterface | undefined> {
        const [debtEvent] = await (tx ?? this.db)
            .select()
            .from(DebtEventEntityTable)
            .where(and(eq(DebtEventEntityTable.transactionId, transactionId), isNull(DebtEventEntityTable.deletedAt)))
            .limit(1);

        return debtEvent;
    }

    async findByAccountId(accountId: number, tx?: DB): Promise<DebtEventEntityInterface[]> {
        return await (tx ?? this.db).query.DebtEventEntityTable.findMany({
            where: and(eq(DebtEventEntityTable.debtAccountId, accountId), isNull(DebtEventEntityTable.deletedAt))
        });
    }

    async findByAccountIdAndSource(accountId: number, source: DebtEventSourceEnum, tx?: DB): Promise<DebtEventEntityInterface[]> {
        return await (tx ?? this.db).query.DebtEventEntityTable.findMany({
            where: and(
                eq(DebtEventEntityTable.debtAccountId, accountId),
                eq(DebtEventEntityTable.source, source),
                isNull(DebtEventEntityTable.deletedAt)
            )
        });
    }

    async deleteByTransactionId(transactionId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(DebtEventEntityTable).where(eq(DebtEventEntityTable.transactionId, transactionId));
    }

    async deleteByAccountIdAndSource(accountId: number, source: DebtEventSourceEnum, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .delete(DebtEventEntityTable)
            .where(and(eq(DebtEventEntityTable.debtAccountId, accountId), eq(DebtEventEntityTable.source, source)));
    }

    async deleteByAccountId(accountId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(DebtEventEntityTable).where(eq(DebtEventEntityTable.debtAccountId, accountId));
    }

    async archiveByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        if (!isNotEmptyArray(accountIds)) {
            return;
        }

        await (tx ?? this.db)
            .update(DebtEventEntityTable)
            .set({ deletedAt: new Date() })
            .where(inArray(DebtEventEntityTable.debtAccountId, accountIds));
    }

    async restoreByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        if (!isNotEmptyArray(accountIds)) {
            return;
        }

        await (tx ?? this.db)
            .update(DebtEventEntityTable)
            .set({ deletedAt: null })
            .where(inArray(DebtEventEntityTable.debtAccountId, accountIds));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(DebtEventEntityTable);
    }
}
