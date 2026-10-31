import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { isInitialSyncIncomplete } from '../../sync/src/core/utils/is-initial-sync-incomplete.util';
import { selectAnalyticsHistorySyncs } from '../src/sync/utils/select-analytics-history-syncs.util';

import type { AnalyticsHistorySyncInterface } from '../src/sync/interface/analytics-history-sync.interface';

vi.mock('@budgie/sync', () => import('../../sync/src/core/utils/is-initial-sync-incomplete.util'));

const historySync = (accountId: number, type = AccountTypeEnum.BANK_SYNC, isActive = true): AnalyticsHistorySyncInterface => ({
    account: { id: accountId, type, isActive, title: `Account ${accountId}`, integrationId: 1 },
    sync: {
        id: accountId,
        accountId,
        provider: ExternalSourceEnum.MONOBANK,
        enabled: true,
        mode: SyncModeEnum.BACKWARD,
        status: SyncStatusEnum.IDLE,
        backwardSyncFromAt: null,
        backwardSyncLimitAt: null,
        forwardSyncFromAt: new Date('2026-10-01'),
        backwardSyncedAt: null,
        backwardBatchAt: null,
        forwardSyncedAt: null,
        setupBalance: null,
        balanceAdjustmentTransactionId: null,
        reconciledAt: null,
        reconciledBalance: null,
        reconciliationTransactionId: null,
        transactionCount: 0,
        errorCount: 0,
        lastError: null,
        lastErrorCode: null,
        lastWarning: null,
        binanceTradeCursor: null,
        binanceCapitalPendingFromAt: null,
        createdAt: new Date('2026-10-01'),
        updatedAt: new Date('2026-10-01'),
        deletedAt: null
    }
});

describe('analytics history completeness', () => {
    it('keeps initial history incomplete even before its import window is known', () => {
        expect(isInitialSyncIncomplete(historySync(1).sync)).toBe(true);
    });

    it('does not treat disabled or failed initial imports as complete', () => {
        const pending = historySync(1);
        const paused = { ...pending, sync: { ...pending.sync, enabled: false } };
        const failed = { ...pending, sync: { ...pending.sync, status: SyncStatusEnum.FAILED } };
        const stopped = { ...failed, sync: { ...failed.sync, enabled: false } };
        expect(selectAnalyticsHistorySyncs([paused, failed, stopped], null)).toHaveLength(3);
    });

    it('releases forward updates and empty initial windows', () => {
        const pending = historySync(1);
        expect(isInitialSyncIncomplete({ ...pending.sync, mode: SyncModeEnum.FORWARD })).toBe(false);
        expect(isInitialSyncIncomplete({ ...pending.sync, backwardSyncLimitAt: pending.sync.forwardSyncFromAt })).toBe(false);
    });

    it('keeps cursor completion gated until the sync changes to forward mode', () => {
        const pending = historySync(1);
        const sync = { ...pending.sync, backwardSyncLimitAt: new Date('2026-01-01'), backwardSyncFromAt: new Date('2026-01-01') };
        expect(isInitialSyncIncomplete(sync)).toBe(true);
    });

    it('uses all accounts for null and empty account filters', () => {
        const pending = [historySync(1), historySync(2)];
        expect(selectAnalyticsHistorySyncs(pending, null)).toHaveLength(2);
        expect(selectAnalyticsHistorySyncs(pending, [])).toHaveLength(2);
    });

    it('unblocks when importing accounts are excluded and blocks when included again', () => {
        const pending = [historySync(1), historySync(2)];
        expect(selectAnalyticsHistorySyncs(pending, [3])).toEqual([]);
        expect(selectAnalyticsHistorySyncs(pending, [2]).map(row => row.account.id)).toEqual([2]);
    });

    it('keeps inactive accounts in category and tag scope', () => {
        expect(selectAnalyticsHistorySyncs([historySync(1, AccountTypeEnum.BANK_SYNC, false)], null)).toHaveLength(1);
    });

    it('limits Runway to active liquid accounts and optionally crypto', () => {
        const pending = [
            historySync(1),
            historySync(2, AccountTypeEnum.CRYPTO_SYNC),
            historySync(3, AccountTypeEnum.SAVINGS),
            historySync(4, AccountTypeEnum.BANK_SYNC, false)
        ];
        expect(selectAnalyticsHistorySyncs(pending, null, [AccountTypeEnum.BANK_SYNC]).map(row => row.account.id)).toEqual([1]);
        expect(
            selectAnalyticsHistorySyncs(pending, null, [AccountTypeEnum.BANK_SYNC, AccountTypeEnum.CRYPTO_SYNC]).map(row => row.account.id)
        ).toEqual([1, 2]);
    });

    it('automatically releases the gate when the last initial import finishes', () => {
        const finished = historySync(1);
        expect(selectAnalyticsHistorySyncs([{ ...finished, sync: { ...finished.sync, mode: SyncModeEnum.FORWARD } }], null)).toEqual([]);
    });
});
