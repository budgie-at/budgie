import { accountBalanceRepository, accountRepository, syncRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { SyncHistoryDepthEnum } from '@app/sync/enum/sync-history-depth.enum';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { resyncService } from '@app/sync/service/resync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import {
    ExternalSourceEnum,
    SyncModeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { and, eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { buildMonobank, monobankStub, seed, testDb } from '../../harness';

import type { AccountEntityInterface } from '@budgie/contracts';
import type { Account } from '@liaugust/monobank-sdk';

const HISTORY_TIME = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60;
const HISTORY = [buildMonobank.transaction({ id: 'history-expense', amount: -20_000, hold: false, time: HISTORY_TIME })];
const HISTORY_LEDGER = -200_000_000;

const BACKGROUND_TASK_SUCCESS_RESULT = 1;

const skipNextMonobankSync = (): void => {
    vi.spyOn(monobankSyncService, 'sync').mockResolvedValueOnce(BACKGROUND_TASK_SUCCESS_RESULT);
};

const setupMonobankSync = async (bankAccount: Account): Promise<AccountEntityInterface> => {
    monobankStub.clientInfo(buildMonobank.clientInfo({ accounts: [bankAccount], jars: [] }));
    vi.spyOn(monobankSyncService, 'registerBackgroundTask').mockResolvedValue();
    skipNextMonobankSync();
    await monobankSyncService.setupAccountSyncBatch('test-token', [bankAccount.id], SyncHistoryDepthEnum.MONTHS_3);
    const [account] = await accountRepository.findByExternalIds([bankAccount.id]);

    return account;
};

const fetchBalanceAdjustments = (accountId: number) =>
    testDb
        .select({
            amount: TransactionEntryEntityTable.amount,
            type: TransactionEntryEntityTable.type,
            operatedAt: TransactionEntityTable.operatedAt
        })
        .from(TransactionEntryEntityTable)
        .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
        .where(and(eq(TransactionEntryEntityTable.accountId, accountId), eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT)))
        .all();

const readBalance = (accountId: number): number | undefined => accountBalanceRepository.getByAccountId(accountId).get()?.balance;

const importHistory = async (onLaterRequest: () => Promise<void> | void = emptyFn): Promise<void> => {
    monobankStub.statementThen(HISTORY, onLaterRequest);
    await monobankSyncService.sync();
};

const expectReconciledTo = (accountId: number, setupBalance: number): void => {
    expect(fetchBalanceAdjustments(accountId)).toStrictEqual([expect.objectContaining({ amount: setupBalance - HISTORY_LEDGER })]);
    expect(readBalance(accountId)).toBe(setupBalance);
};

describe('monobank/setup-balance', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the setup balance during import, then books one opening adjustment before the oldest transaction', async () => {
        const account = await setupMonobankSync(buildMonobank.account({ id: 'mono-setup', balance: 150_000 }));
        const balancesDuringImport = new Set([readBalance(account.id)]);

        await importHistory(() => {
            balancesDuringImport.add(readBalance(account.id));
        });

        expect(balancesDuringImport).toStrictEqual(new Set([1_500_000_000]));
        expectReconciledTo(account.id, 1_500_000_000);
        expect(fetchBalanceAdjustments(account.id)[0]).toMatchObject({
            type: TransactionEntryTypeEnum.DEBIT,
            operatedAt: new Date((HISTORY_TIME - 1) * 1000)
        });
    });

    it('books no correction for matching history or when a fully synced account is added again', async () => {
        const bankAccount = buildMonobank.account({ id: 'mono-match', balance: -20_000 });
        const account = await setupMonobankSync(bankAccount);
        await importHistory();

        await setupMonobankSync({ ...bankAccount, balance: 50_000 });
        await importHistory();

        expect(fetchBalanceAdjustments(account.id)).toStrictEqual([]);
        expect(readBalance(account.id)).toBe(HISTORY_LEDGER);
    });

    it('shows own money without the credit limit for credit cards', async () => {
        const account = await setupMonobankSync(buildMonobank.account({ id: 'mono-credit', balance: 1_200_000, creditLimit: 1_000_000 }));
        const balanceBeforeImport = readBalance(account.id);

        await importHistory();

        expect(balanceBeforeImport).toBe(2_000_000_000);
        expectReconciledTo(account.id, 2_000_000_000);
    });

    it('keeps the setup balance while paused mid-import and reconciles only after resuming', async () => {
        const account = await setupMonobankSync(buildMonobank.account({ id: 'mono-pause', balance: 150_000 }));
        await importHistory(async () => monobankSyncService.setAccountSyncEnabled(account.id, false));
        const pausedBalance = readBalance(account.id);
        const pausedAdjustments = fetchBalanceAdjustments(account.id);

        monobankStub.statementThen([], emptyFn);
        skipNextMonobankSync();
        await monobankSyncService.setAccountSyncEnabled(account.id, true);
        await monobankSyncService.sync();

        expect(pausedBalance).toBe(1_500_000_000);
        expect(pausedAdjustments).toStrictEqual([]);
        expectReconciledTo(account.id, 1_500_000_000);
    });

    it('rolls back a reconciliation interrupted after its writes and books it once on retry', async () => {
        const account = await setupMonobankSync(buildMonobank.account({ id: 'mono-retry', balance: 150_000 }));
        const adjustmentCountsBeforeCompletion: number[] = [];

        await importHistory(() => {
            adjustmentCountsBeforeCompletion.push(fetchBalanceAdjustments(account.id).length);
            if (!vi.isMockFunction(accountBalanceIncrementalService.updateBalancesByAccountIds)) {
                vi.spyOn(accountBalanceIncrementalService, 'updateBalancesByAccountIds').mockRejectedValueOnce(new Error('app suspended'));
            }
        });

        expect(adjustmentCountsBeforeCompletion.slice(0, 3)).toStrictEqual([0, 0, 0]);
        expectReconciledTo(account.id, 1_500_000_000);
    });

    it('fails a full resync visibly when Monobank is unreachable and otherwise replaces the adjustment', async () => {
        const bankAccount = buildMonobank.account({ id: 'mono-resync', balance: 150_000 });
        const account = await setupMonobankSync(bankAccount);
        await importHistory();

        monobankStub.clientInfoFailure();
        await expect(resyncService.resync({ accountId: account.id, sinceDays: null })).rejects.toThrow();
        const failedResyncMode = (await syncRepository.getByAccountId(account.id))?.mode;

        monobankStub.clientInfo(buildMonobank.clientInfo({ accounts: [{ ...bankAccount, balance: 100_000 }], jars: [] }));
        monobankStub.statementThen(HISTORY, emptyFn);
        await resyncService.resync({ accountId: account.id, sinceDays: null });
        await syncWorkloadService.run('await-resync-sync', async () => Promise.resolve());
        await monobankSyncService.sync();

        expect(failedResyncMode).toBe(SyncModeEnum.FORWARD);
        expectReconciledTo(account.id, 1_000_000_000);
    });

    it('resyncs a Binance account fully without capturing a Monobank setup balance', async () => {
        const account = seed.account({ externalId: 'binance-spot' });
        seed.sync({ accountId: account.id, provider: ExternalSourceEnum.BINANCE });
        const fetchSetupBalanceSpy = vi.spyOn(monobankSyncService, 'fetchSetupBalance');

        await resyncService.resync({ accountId: account.id, sinceDays: null });

        expect(fetchSetupBalanceSpy).not.toHaveBeenCalled();
        await expect(syncRepository.getByAccountId(account.id)).resolves.toMatchObject({ mode: SyncModeEnum.BACKWARD, setupBalance: null });
    });
});
