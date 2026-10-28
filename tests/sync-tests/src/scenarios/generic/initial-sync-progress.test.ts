import { ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { resolveInitialSyncProgress } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';

import type { SyncEntityInterface } from '@budgie/contracts';

const setupAt = new Date('2026-10-22T12:00:00.000Z');
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const daysBeforeSetup = (days: number) => new Date(setupAt.getTime() - days * millisecondsPerDay);
const historyLimitAt = daysBeforeSetup(92);

const makeSync = (overrides: Partial<SyncEntityInterface>): SyncEntityInterface => ({
    id: 1,
    createdAt: setupAt,
    updatedAt: setupAt,
    deletedAt: null,
    accountId: 1,
    provider: ExternalSourceEnum.MONOBANK,
    enabled: true,
    mode: SyncModeEnum.BACKWARD,
    status: SyncStatusEnum.SYNCING,
    backwardSyncedAt: null,
    backwardSyncFromAt: setupAt,
    backwardSyncLimitAt: historyLimitAt,
    backwardBatchAt: null,
    forwardSyncedAt: null,
    forwardSyncFromAt: setupAt,
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
    ...overrides
});

describe('generic/initial-sync-progress', () => {
    const indeterminate = { percent: null, minutesLeft: null };

    it('estimates one minute per remaining Monobank window across accounts', () => {
        expect(resolveInitialSyncProgress([makeSync({}), makeSync({ id: 2, accountId: 2 })])).toEqual({ percent: 0, minutesLeft: 6 });
    });

    it('measures progress from the setup time to the history limit', () => {
        expect(resolveInitialSyncProgress([makeSync({ backwardSyncFromAt: daysBeforeSetup(62) })])).toEqual({
            percent: 67,
            minutesLeft: 1
        });
    });

    it('starts from the setup time when the backward cursor is not set yet', () => {
        expect(resolveInitialSyncProgress([makeSync({ backwardSyncFromAt: null })])).toEqual({ percent: 0, minutesLeft: 3 });
    });

    it('caps progress below 100 and keeps at least one minute while the import is still running', () => {
        expect(resolveInitialSyncProgress([makeSync({ backwardSyncFromAt: historyLimitAt })])).toEqual({ percent: 99, minutesLeft: 1 });
    });

    it('is indeterminate without a history limit or a known provider pace', () => {
        expect(resolveInitialSyncProgress([makeSync({ backwardSyncLimitAt: null })])).toEqual(indeterminate);
        expect(resolveInitialSyncProgress([makeSync({ provider: ExternalSourceEnum.BINANCE })])).toEqual(indeterminate);
        expect(resolveInitialSyncProgress([makeSync({}), makeSync({ id: 2, provider: ExternalSourceEnum.BINANCE })])).toEqual(
            indeterminate
        );
    });

    it('ignores finished, disabled, missing and new-transactions-only syncs', () => {
        expect(
            resolveInitialSyncProgress([
                null,
                makeSync({ mode: SyncModeEnum.FORWARD }),
                makeSync({ enabled: false }),
                makeSync({ backwardSyncLimitAt: setupAt })
            ])
        ).toBeNull();
    });
});
