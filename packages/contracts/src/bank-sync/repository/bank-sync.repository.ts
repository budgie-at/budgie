import { Log } from '@budgie/logger';
import { and, asc, eq, getTableColumns, isNull, lt, or } from 'drizzle-orm';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankSyncModeEnum } from '../enum/bank-sync-mode.enum';
import { BankSyncStatusEnum } from '../enum/bank-sync-status.enum';
import { BankSyncEntityTable } from '../table/bank-sync-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { BankSyncCreateEntityInterface } from '../entity/bank-sync-create-entity.interface';
import type { BankSyncEntityInterface } from '../entity/bank-sync-entity.interface';
import type { BankSyncUpdateEntityInterface } from '../entity/bank-sync-update-entity.interface';

export class BankSyncRepository {
    constructor(private db: DB) {}

    @Log(
        (id, input, tx) => `enter id=${id} mode=${input.mode ?? 'unchanged'} hasTx=${String(isDefined(tx))}`,
        (result, id, input, tx) =>
            `done id=${id} mode=${input.mode ?? 'unchanged'} hasTx=${String(isDefined(tx))} resultMode=${result.mode} forwardSyncFromAt=${String(result.forwardSyncFromAt)} forwardSyncedAt=${String(result.forwardSyncedAt)} transactionCount=${result.transactionCount}`,
        (error, id, input, tx) =>
            `throw id=${id} mode=${input.mode ?? 'unchanged'} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async update(id: number, input: BankSyncUpdateEntityInterface, tx?: DB): Promise<BankSyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({ ...input })
            .where(eq(BankSyncEntityTable.id, id))
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
    async getPendingForwardSync(provider: ExternalSourceEnum, staleThresholdMs: number): Promise<BankSyncEntityInterface[]> {
        const staleTime = new Date(Date.now() - staleThresholdMs);

        return await this.selectWithActiveAccount()
            .where(
                and(
                    eq(BankSyncEntityTable.provider, provider),
                    eq(BankSyncEntityTable.enabled, true),
                    eq(BankSyncEntityTable.mode, BankSyncModeEnum.FORWARD),
                    isNull(BankSyncEntityTable.deletedAt),
                    isNull(AccountEntityTable.deletedAt),
                    or(isNull(BankSyncEntityTable.forwardSyncedAt), lt(BankSyncEntityTable.forwardSyncedAt, staleTime))
                )
            )
            .orderBy(asc(BankSyncEntityTable.forwardSyncedAt));
    }

    @Log(
        (accountId, since, tx) => `enter accountId=${accountId} since=${since.toISOString()} hasTx=${String(isDefined(tx))}`,
        (_result, accountId, since, tx) => `done accountId=${accountId} since=${since.toISOString()} hasTx=${String(isDefined(tx))}`,
        (error, accountId, since, tx) =>
            `throw accountId=${accountId} since=${since.toISOString()} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async resetForWindowedResync(accountId: number, since: Date, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({
                mode: BankSyncModeEnum.FORWARD,
                status: BankSyncStatusEnum.IDLE,
                forwardSyncFromAt: since,
                forwardSyncedAt: null
            })
            .where(eq(BankSyncEntityTable.accountId, accountId));
    }

    async create(input: BankSyncCreateEntityInterface, tx?: DB): Promise<BankSyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db).insert(BankSyncEntityTable).values([input]).returning();

        return bankSync;
    }

    async getById(id: number): Promise<BankSyncEntityInterface | undefined> {
        return await this.db.query.BankSyncEntityTable.findFirst({
            where: and(eq(BankSyncEntityTable.id, id), isNull(BankSyncEntityTable.deletedAt))
        });
    }

    async getByAccountId(accountId: number, tx?: DB): Promise<BankSyncEntityInterface | undefined> {
        return await (tx ?? this.db).query.BankSyncEntityTable.findFirst({
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

    async getEnabledByProvider(provider: ExternalSourceEnum): Promise<BankSyncEntityInterface[]> {
        return await this.selectWithActiveAccount().where(
            and(
                eq(BankSyncEntityTable.provider, provider),
                eq(BankSyncEntityTable.enabled, true),
                isNull(BankSyncEntityTable.deletedAt),
                isNull(AccountEntityTable.deletedAt)
            )
        );
    }

    async getPendingBackwardSync(provider: ExternalSourceEnum): Promise<BankSyncEntityInterface[]> {
        return await this.selectWithActiveAccount().where(
            and(
                eq(BankSyncEntityTable.provider, provider),
                eq(BankSyncEntityTable.enabled, true),
                eq(BankSyncEntityTable.mode, BankSyncModeEnum.BACKWARD),
                isNull(BankSyncEntityTable.deletedAt),
                isNull(AccountEntityTable.deletedAt)
            )
        );
    }

    async setStatus(id: number, status: BankSyncStatusEnum, tx?: DB): Promise<void> {
        await (tx ?? this.db).update(BankSyncEntityTable).set({ status }).where(eq(BankSyncEntityTable.id, id));
    }

    async setEnabled(accountId: number, enabled: boolean, tx?: DB): Promise<void> {
        await (tx ?? this.db).update(BankSyncEntityTable).set({ enabled }).where(eq(BankSyncEntityTable.accountId, accountId));
    }

    async recordError(id: number, error: string, tx?: DB): Promise<void> {
        const bankSync = await this.getById(id);
        if (isDefined(bankSync)) {
            await (tx ?? this.db)
                .update(BankSyncEntityTable)
                .set({
                    lastError: error,
                    errorCount: bankSync.errorCount + 1
                })
                .where(eq(BankSyncEntityTable.id, id));
        }
    }

    async resetForResync(accountId: number, tx?: DB): Promise<void> {
        const now = new Date();
        await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({
                mode: BankSyncModeEnum.BACKWARD,
                status: BankSyncStatusEnum.IDLE,
                backwardSyncFromAt: now,
                backwardSyncedAt: null,
                backwardCompletedAt: null,
                forwardSyncFromAt: now,
                forwardSyncedAt: null,
                transactionCount: 0,
                errorCount: 0,
                lastError: null
            })
            .where(eq(BankSyncEntityTable.accountId, accountId));
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(BankSyncEntityTable);
    }

    private selectWithActiveAccount() {
        return this.db
            .select(getTableColumns(BankSyncEntityTable))
            .from(BankSyncEntityTable)
            .innerJoin(AccountEntityTable, eq(BankSyncEntityTable.accountId, AccountEntityTable.id))
            .$dynamic();
    }
}
