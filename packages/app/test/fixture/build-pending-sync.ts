import { ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';

import type { SyncEntityInterface } from '@budgie/contracts';

const baseSyncDate = new Date('2026-06-01T00:00:00.000Z');

export const buildPendingSync = (overrides: Partial<SyncEntityInterface> = {}): SyncEntityInterface => ({
    id: 1,
    accountId: 10,
    provider: ExternalSourceEnum.MONOBANK,
    enabled: true,
    mode: SyncModeEnum.BACKWARD,
    status: SyncStatusEnum.IDLE,
    createdAt: baseSyncDate,
    updatedAt: baseSyncDate,
    deletedAt: null,
    backwardSyncedAt: null,
    backwardSyncFromAt: baseSyncDate,
    backwardSyncLimitAt: null,
    backwardBatchAt: null,
    forwardSyncedAt: baseSyncDate,
    forwardSyncFromAt: baseSyncDate,
    transactionCount: 0,
    errorCount: 0,
    setupBalance: null,
    balanceAdjustmentTransactionId: null,
    reconciledAt: null,
    reconciledBalance: null,
    reconciliationTransactionId: null,
    lastError: null,
    lastErrorCode: null,
    lastWarning: null,
    binanceTradeCursor: null,
    binanceCapitalPendingFromAt: null,
    ...overrides
});
