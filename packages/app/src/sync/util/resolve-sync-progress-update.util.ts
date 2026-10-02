import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import type { SyncEntityInterface, SyncUpdateEntityInterface } from '@budgie/contracts';
import type { SyncBatchResultInterface } from '@budgie/sync';

export const resolveSyncProgressUpdate = (sync: SyncEntityInterface, result: SyncBatchResultInterface): SyncUpdateEntityInterface => {
    const now = new Date();
    const transactionCount = result.transactionCount ?? result.transactions.length;
    const baseUpdate = { transactionCount: sync.transactionCount + transactionCount, errorCount: 0, lastError: null };

    if (result.completed && sync.mode === SyncModeEnum.FORWARD) {
        return { ...baseUpdate, status: SyncStatusEnum.IDLE, forwardSyncedAt: now, forwardSyncFromAt: now };
    }

    if (result.completed) {
        return {
            ...baseUpdate,
            mode: SyncModeEnum.FORWARD,
            status: SyncStatusEnum.IDLE,
            backwardSyncedAt: result.nextTo,
            backwardSyncFromAt: result.nextFrom
        };
    }

    if (sync.mode === SyncModeEnum.BACKWARD) {
        const nextBackwardSyncedAt = isPositiveNumber(transactionCount) ? null : (sync.backwardSyncedAt ?? result.nextTo);

        return { ...baseUpdate, backwardSyncedAt: nextBackwardSyncedAt, backwardSyncFromAt: result.nextTo, backwardBatchAt: now };
    }

    return { ...baseUpdate, forwardSyncFromAt: result.nextFrom };
};
