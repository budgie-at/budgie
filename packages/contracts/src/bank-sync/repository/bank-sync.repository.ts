import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm';

import { DB, TX } from '../../@generic/type/db.type';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { BankSyncCreateEntityInterface } from '../entity/bank-sync-create-entity.interface';
import { BankSyncUpdateEntityInterface } from '../entity/bank-sync-update-entity.interface';
import { BankSyncModeEnum } from '../enum/bank-sync-mode.enum';
import { BankSyncStatusEnum } from '../enum/bank-sync-status.enum';
import { BankSyncEntityTable } from '../table/bank-sync-entity.table';

import type { BankSyncEntityInterface } from '../entity/bank-sync-entity.interface';

export class BankSyncRepository {
    constructor(private db: DB) {}

    async create(input: BankSyncCreateEntityInterface, tx?: TX): Promise<BankSyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db).insert(BankSyncEntityTable).values([input]).returning();

        return bankSync;
    }

    async upsert(input: BankSyncCreateEntityInterface, tx?: TX): Promise<BankSyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db)
            .insert(BankSyncEntityTable)
            .values([input])
            .onConflictDoUpdate({
                target: BankSyncEntityTable.accountId,
                set: { ...input, updatedAt: new Date() }
            })
            .returning();

        return bankSync;
    }

    async update(id: number, input: BankSyncUpdateEntityInterface, tx?: TX): Promise<BankSyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(BankSyncEntityTable.id, id))
            .returning();

        return bankSync;
    }

    async updateByAccountId(accountId: number, input: BankSyncUpdateEntityInterface, tx?: TX): Promise<BankSyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(BankSyncEntityTable.accountId, accountId))
            .returning();

        return bankSync;
    }

    async getById(id: number): Promise<BankSyncEntityInterface | undefined> {
        return await this.db.query.BankSyncEntityTable.findFirst({
            where: and(eq(BankSyncEntityTable.id, id), isNull(BankSyncEntityTable.deletedAt))
        });
    }

    async getByAccountId(accountId: number): Promise<BankSyncEntityInterface | undefined> {
        return await this.db.query.BankSyncEntityTable.findFirst({
            where: and(eq(BankSyncEntityTable.accountId, accountId), isNull(BankSyncEntityTable.deletedAt))
        });
    }

    findByAccountId(accountId: number) {
        return this.db.query.BankSyncEntityTable.findFirst({
            where: and(eq(BankSyncEntityTable.accountId, accountId), isNull(BankSyncEntityTable.deletedAt))
        });
    }

    async getByProvider(provider: ExternalSourceEnum): Promise<BankSyncEntityInterface[]> {
        return await this.db.query.BankSyncEntityTable.findMany({
            where: and(eq(BankSyncEntityTable.provider, provider), isNull(BankSyncEntityTable.deletedAt))
        });
    }

    findByProvider(provider: ExternalSourceEnum) {
        return this.db.query.BankSyncEntityTable.findMany({
            where: and(eq(BankSyncEntityTable.provider, provider), isNull(BankSyncEntityTable.deletedAt))
        });
    }

    async getEnabledByProvider(provider: ExternalSourceEnum): Promise<BankSyncEntityInterface[]> {
        return await this.db.query.BankSyncEntityTable.findMany({
            where: and(
                eq(BankSyncEntityTable.provider, provider),
                eq(BankSyncEntityTable.enabled, true),
                isNull(BankSyncEntityTable.deletedAt)
            )
        });
    }

    async getPendingBackwardSync(provider: ExternalSourceEnum): Promise<BankSyncEntityInterface[]> {
        return await this.db.query.BankSyncEntityTable.findMany({
            where: and(
                eq(BankSyncEntityTable.provider, provider),
                eq(BankSyncEntityTable.enabled, true),
                eq(BankSyncEntityTable.mode, BankSyncModeEnum.BACKWARD),
                isNull(BankSyncEntityTable.deletedAt)
            )
        });
    }

    async getPendingForwardSync(provider: ExternalSourceEnum, staleThresholdMs: number): Promise<BankSyncEntityInterface[]> {
        const staleTime = new Date(Date.now() - staleThresholdMs);

        return await this.db.query.BankSyncEntityTable.findMany({
            where: and(
                eq(BankSyncEntityTable.provider, provider),
                eq(BankSyncEntityTable.enabled, true),
                eq(BankSyncEntityTable.mode, BankSyncModeEnum.FORWARD),
                isNull(BankSyncEntityTable.deletedAt),
                or(isNull(BankSyncEntityTable.forwardSyncFromAt), lt(BankSyncEntityTable.forwardSyncFromAt, staleTime))
            )
        });
    }

    async setStatus(id: number, status: BankSyncStatusEnum, tx?: TX): Promise<void> {
        await (tx ?? this.db).update(BankSyncEntityTable).set({ status, updatedAt: new Date() }).where(eq(BankSyncEntityTable.id, id));
    }

    async setEnabled(accountId: number, enabled: boolean, tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({ enabled, updatedAt: new Date() })
            .where(eq(BankSyncEntityTable.accountId, accountId));
    }

    async incrementTransactionCount(id: number, count: number, tx?: TX): Promise<void> {
        const bankSync = await this.getById(id);
        if (bankSync) {
            await (tx ?? this.db)
                .update(BankSyncEntityTable)
                .set({
                    transactionCount: bankSync.transactionCount + count,
                    updatedAt: new Date()
                })
                .where(eq(BankSyncEntityTable.id, id));
        }
    }

    async recordError(id: number, error: string, tx?: TX): Promise<void> {
        const bankSync = await this.getById(id);
        if (bankSync) {
            await (tx ?? this.db)
                .update(BankSyncEntityTable)
                .set({
                    lastError: error,
                    errorCount: bankSync.errorCount + 1,
                    updatedAt: new Date()
                })
                .where(eq(BankSyncEntityTable.id, id));
        }
    }

    async clearError(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({
                lastError: null,
                errorCount: 0,
                updatedAt: new Date()
            })
            .where(eq(BankSyncEntityTable.id, id));
    }

    async deleteByAccountId(accountId: number, tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({ deletedAt: new Date() })
            .where(eq(BankSyncEntityTable.accountId, accountId));
    }

    async deleteByAccountIds(accountIds: number[], tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({ deletedAt: new Date() })
            .where(inArray(BankSyncEntityTable.accountId, accountIds));
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(BankSyncEntityTable);
    }
}
