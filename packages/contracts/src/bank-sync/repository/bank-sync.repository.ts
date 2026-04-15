import { and, asc, eq, getTableColumns, isNull, lt, or } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankSyncCreateEntityInterface } from '../entity/bank-sync-create-entity-interface.type';
import { BankSyncUpdateEntityInterface } from '../entity/bank-sync-update-entity-interface.type';
import { BankSyncModeEnum } from '../enum/bank-sync-mode.enum';
import { BankSyncStatusEnum } from '../enum/bank-sync-status.enum';
import { BankSyncEntityTable } from '../table/bank-sync-entity.table';

import type { BankSyncEntityInterface } from '../entity/bank-sync-entity-interface.type';

export class BankSyncRepository {
    constructor(private db: DB) {}

    async create(input: BankSyncCreateEntityInterface, tx?: DB): Promise<BankSyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db).insert(BankSyncEntityTable).values([input]).returning();

        return bankSync;
    }

    async update(id: number, input: BankSyncUpdateEntityInterface, tx?: DB): Promise<BankSyncEntityInterface> {
        const [bankSync] = await (tx ?? this.db)
            .update(BankSyncEntityTable)
            .set({ ...input })
            .where(eq(BankSyncEntityTable.id, id))
            .returning();

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
