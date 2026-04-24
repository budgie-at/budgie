import { and, asc, eq, getTableColumns, isNull, lt, or } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { LoggerNamespaceEnum } from '../../@generic/enum/logger-namespace.enum';
import { getLogger } from '../../@generic/util/logger/get-logger.util';
import { Log } from '../../@generic/util/logger/log-decorator.util';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankSyncModeEnum } from '../enum/bank-sync-mode.enum';
import { BankSyncStatusEnum } from '../enum/bank-sync-status.enum';
import { BankSyncEntityTable } from '../table/bank-sync-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { BankSyncCreateEntityInterface } from '../entity/bank-sync-create-entity.interface';
import type { BankSyncEntityInterface } from '../entity/bank-sync-entity.interface';
import type { BankSyncUpdateEntityInterface } from '../entity/bank-sync-update-entity.interface';

const logger = getLogger(LoggerNamespaceEnum.REPO);

export class BankSyncRepository {
    constructor(private db: DB) {}

    @Log(LoggerNamespaceEnum.REPO, 'repo:bankSync:update')
    async update(id: number, input: BankSyncUpdateEntityInterface, tx?: DB): Promise<BankSyncEntityInterface> {
        logger.log('repo:bankSync:update', { id, input });
        const [bankSync] = await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({ ...input })
            .where(eq(BankSyncEntityTable.id, id))
            .returning();
        logger.log('repo:bankSync:update:done', {
            id,
            resultForwardSyncFromAt: bankSync.forwardSyncFromAt,
            resultForwardSyncedAt: bankSync.forwardSyncedAt,
            resultMode: bankSync.mode,
            resultTransactionCount: bankSync.transactionCount
        });

        return bankSync;
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

    async getPendingForwardSync(provider: ExternalSourceEnum, staleThresholdMs: number): Promise<BankSyncEntityInterface[]> {
        const staleTime = new Date(Date.now() - staleThresholdMs);

        const results = await this.selectWithActiveAccount()
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

        logger.log('repo:bankSync:getPendingForwardSync', {
            staleThresholdMs,
            staleTime,
            count: results.length,
            syncs: results.map(entry => ({
                id: entry.id,
                accountId: entry.accountId,
                forwardSyncFromAt: entry.forwardSyncFromAt,
                forwardSyncedAt: entry.forwardSyncedAt,
                mode: entry.mode,
                transactionCount: entry.transactionCount
            }))
        });

        return results;
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
