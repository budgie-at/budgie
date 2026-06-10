import { Log } from '@budgie/logger';
import { and, asc, eq, getTableColumns, isNull, lt, or } from 'drizzle-orm';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { SyncModeEnum } from '../enum/sync-mode.enum';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncEntityTable } from '../table/sync-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { SyncCreateEntityInterface } from '../entity/sync-create-entity.interface';
import type { SyncEntityInterface } from '../entity/sync-entity.interface';
import type { SyncUpdateEntityInterface } from '../entity/sync-update-entity.interface';

export class SyncRepository {
    constructor(private db: DB) {}

    @Log(
        (id, input, tx) => `enter id=${id} mode=${input.mode ?? 'unchanged'} hasTx=${String(isDefined(tx))}`,
        (result, id, input, tx) =>
            `done id=${id} mode=${input.mode ?? 'unchanged'} hasTx=${String(isDefined(tx))} resultMode=${result.mode} forwardSyncFromAt=${String(result.forwardSyncFromAt)} forwardSyncedAt=${String(result.forwardSyncedAt)} transactionCount=${result.transactionCount}`,
        (error, id, input, tx) =>
            `throw id=${id} mode=${input.mode ?? 'unchanged'} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async update(id: number, input: SyncUpdateEntityInterface, tx?: DB): Promise<SyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db)
            .update(SyncEntityTable)
            .set({ ...input })
            .where(eq(SyncEntityTable.id, id))
            .returning();

        return bankSync;
    }

    @Log(
        (provider, staleThresholdMs) => `enter provider=${provider} staleThresholdMs=${staleThresholdMs}`,
        (result, provider, staleThresholdMs) =>
            `done provider=${provider} staleThresholdMs=${staleThresholdMs} ids=${result.map(row => row.id).join(',')}`,
        (error, provider, staleThresholdMs) =>
            `throw provider=${provider} staleThresholdMs=${staleThresholdMs} error=${getErrorMessage(error)}`
    )
    async getPendingForwardSync(provider: ExternalSourceEnum, staleThresholdMs: number): Promise<SyncEntityInterface[]> {
        const staleTime = new Date(Date.now() - staleThresholdMs);

        return await this.selectWithActiveAccount()
            .where(
                and(
                    eq(SyncEntityTable.provider, provider),
                    eq(SyncEntityTable.enabled, true),
                    eq(SyncEntityTable.mode, SyncModeEnum.FORWARD),
                    isNull(SyncEntityTable.deletedAt),
                    isNull(AccountEntityTable.deletedAt),
                    or(isNull(SyncEntityTable.forwardSyncedAt), lt(SyncEntityTable.forwardSyncedAt, staleTime))
                )
            )
            .orderBy(asc(SyncEntityTable.forwardSyncedAt));
    }

    @Log(
        (accountId, since, tx) => `enter accountId=${accountId} since=${since.toISOString()} hasTx=${String(isDefined(tx))}`,
        (_result, accountId, since, tx) => `done accountId=${accountId} since=${since.toISOString()} hasTx=${String(isDefined(tx))}`,
        (error, accountId, since, tx) =>
            `throw accountId=${accountId} since=${since.toISOString()} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async resetForWindowedResync(accountId: number, since: Date, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(SyncEntityTable)
            .set({
                mode: SyncModeEnum.FORWARD,
                status: SyncStatusEnum.IDLE,
                forwardSyncFromAt: since,
                forwardSyncedAt: null
            })
            .where(eq(SyncEntityTable.accountId, accountId));
    }

    async create(input: SyncCreateEntityInterface, tx?: DB): Promise<SyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db).insert(SyncEntityTable).values([input]).returning();

        return bankSync;
    }

    async getById(id: number): Promise<SyncEntityInterface | undefined> {
        return await this.db.query.SyncEntityTable.findFirst({
            where: and(eq(SyncEntityTable.id, id), isNull(SyncEntityTable.deletedAt))
        });
    }

    async getByAccountId(accountId: number, tx?: DB): Promise<SyncEntityInterface | undefined> {
        return await (tx ?? this.db).query.SyncEntityTable.findFirst({
            where: and(eq(SyncEntityTable.accountId, accountId), isNull(SyncEntityTable.deletedAt))
        });
    }

    findByAccountId(accountId: number) {
        return this.db.query.SyncEntityTable.findFirst({
            where: and(eq(SyncEntityTable.accountId, accountId), isNull(SyncEntityTable.deletedAt))
        });
    }

    async getByProvider(provider: ExternalSourceEnum): Promise<SyncEntityInterface[]> {
        return await this.db.query.SyncEntityTable.findMany({
            where: and(eq(SyncEntityTable.provider, provider), isNull(SyncEntityTable.deletedAt))
        });
    }

    async getEnabledByProvider(provider: ExternalSourceEnum): Promise<SyncEntityInterface[]> {
        return await this.selectWithActiveAccount().where(
            and(
                eq(SyncEntityTable.provider, provider),
                eq(SyncEntityTable.enabled, true),
                isNull(SyncEntityTable.deletedAt),
                isNull(AccountEntityTable.deletedAt)
            )
        );
    }

    async getPendingBackwardSync(provider: ExternalSourceEnum): Promise<SyncEntityInterface[]> {
        return await this.selectWithActiveAccount().where(
            and(
                eq(SyncEntityTable.provider, provider),
                eq(SyncEntityTable.enabled, true),
                eq(SyncEntityTable.mode, SyncModeEnum.BACKWARD),
                isNull(SyncEntityTable.deletedAt),
                isNull(AccountEntityTable.deletedAt)
            )
        );
    }

    async setStatus(id: number, status: SyncStatusEnum, tx?: DB): Promise<void> {
        await (tx ?? this.db).update(SyncEntityTable).set({ status }).where(eq(SyncEntityTable.id, id));
    }

    async setEnabled(accountId: number, enabled: boolean, tx?: DB): Promise<void> {
        await (tx ?? this.db).update(SyncEntityTable).set({ enabled }).where(eq(SyncEntityTable.accountId, accountId));
    }

    async recordError(id: number, error: string, tx?: DB): Promise<void> {
        const bankSync = await this.getById(id);
        if (isDefined(bankSync)) {
            await (tx ?? this.db)
                .update(SyncEntityTable)
                .set({
                    lastError: error,
                    errorCount: bankSync.errorCount + 1
                })
                .where(eq(SyncEntityTable.id, id));
        }
    }

    async resetForResync(accountId: number, tx?: DB): Promise<void> {
        const now = new Date();
        await (tx ?? this.db)
            .update(SyncEntityTable)
            .set({
                mode: SyncModeEnum.BACKWARD,
                status: SyncStatusEnum.IDLE,
                backwardSyncFromAt: now,
                backwardSyncedAt: null,
                forwardSyncFromAt: now,
                forwardSyncedAt: null,
                transactionCount: 0,
                errorCount: 0,
                lastError: null
            })
            .where(eq(SyncEntityTable.accountId, accountId));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(SyncEntityTable);
    }

    private selectWithActiveAccount() {
        return this.db
            .select(getTableColumns(SyncEntityTable))
            .from(SyncEntityTable)
            .innerJoin(AccountEntityTable, eq(SyncEntityTable.accountId, AccountEntityTable.id))
            .$dynamic();
    }
}
