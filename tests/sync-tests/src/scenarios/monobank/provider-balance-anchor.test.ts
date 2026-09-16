import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountBalanceEntityTable, AccountEntityTable, SyncBalanceAuthorityEnum, SyncEntityTable } from '@budgie/contracts';
import { eq, inArray } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { buildMonobank, monobankStub, testDb } from '../../harness';

const BACKGROUND_TASK_SUCCESS_RESULT = 1;

describe('monobank/provider-balance-anchor', () => {
    it('anchors every selected account before history work starts', async () => {
        const syncSpy = vi.spyOn(monobankSyncService, 'sync').mockResolvedValue(BACKGROUND_TASK_SUCCESS_RESULT);
        const registerBackgroundTaskSpy = vi.spyOn(monobankSyncService, 'registerBackgroundTask').mockResolvedValue();
        const accounts = [
            buildMonobank.account({ id: 'mono-a', iban: 'UA000000000000000000000000001', balance: 12_550 }),
            buildMonobank.account({ id: 'mono-b', iban: 'UA000000000000000000000000002', balance: -2_000 })
        ];
        const jar = buildMonobank.jar({ id: 'mono-jar', balance: 7_525 });
        monobankStub.clientInfo(buildMonobank.clientInfo({ accounts, jars: [jar] }));
        const startedAt = new Date();

        try {
            await monobankSyncService.setupAccountSyncBatch('token', ['mono-a', 'mono-b', 'mono-jar']);
        } finally {
            syncSpy.mockRestore();
            registerBackgroundTaskSpy.mockRestore();
        }

        const anchoredAccounts = testDb
            .select({
                externalId: AccountEntityTable.externalId,
                integrationId: AccountEntityTable.integrationId,
                amount: AccountBalanceEntityTable.amount,
                balanceAuthority: SyncEntityTable.balanceAuthority,
                balanceAnchorCapturedAt: SyncEntityTable.balanceAnchorCapturedAt
            })
            .from(AccountEntityTable)
            .innerJoin(SyncEntityTable, eq(SyncEntityTable.accountId, AccountEntityTable.id))
            .innerJoin(AccountBalanceEntityTable, eq(AccountBalanceEntityTable.accountId, AccountEntityTable.id))
            .where(inArray(AccountEntityTable.externalId, ['mono-a', 'mono-b', 'mono-jar']))
            .all();

        expect(anchoredAccounts).toHaveLength(3);
        expect(anchoredAccounts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    externalId: 'mono-a',
                    amount: 125_500_000,
                    balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER
                }),
                expect.objectContaining({
                    externalId: 'mono-b',
                    amount: -20_000_000,
                    balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER
                }),
                expect.objectContaining({
                    externalId: 'mono-jar',
                    amount: 75_250_000,
                    balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER
                })
            ])
        );
        expect(anchoredAccounts.every(account => account.integrationId !== null)).toBe(true);
        expect(anchoredAccounts.every(account => (account.balanceAnchorCapturedAt?.getTime() ?? 0) >= startedAt.getTime() - 1_000)).toBe(
            true
        );
    });
});
