import { BankSyncModeEnum, BankSyncStatusEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';

import type { BankSyncBatchResultInterface } from '@budgie/bank-sync';
import type { BankSyncEntityInterface } from '@budgie/contracts';

export const applyBankSyncProgressUpdate = async (sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> => {
    const now = new Date();
    const baseUpdate = { transactionCount: sync.transactionCount + result.transactions.length, errorCount: 0, lastError: null };
    const nextBackwardSyncedAt = isNotEmptyArray(result.transactions) ? null : (sync.backwardSyncedAt ?? result.nextTo);

    if (result.completed && sync.mode === BankSyncModeEnum.FORWARD) {
        await bankSyncRepository.update(sync.id, {
            ...baseUpdate,
            status: BankSyncStatusEnum.IDLE,
            forwardSyncedAt: now,
            forwardSyncFromAt: now
        });

        return;
    }

    if (result.completed) {
        await bankSyncRepository.update(sync.id, {
            ...baseUpdate,
            mode: BankSyncModeEnum.FORWARD,
            status: BankSyncStatusEnum.IDLE,
            backwardSyncedAt: result.nextTo,
            backwardSyncFromAt: result.nextFrom
        });

        return;
    }

    if (sync.mode === BankSyncModeEnum.BACKWARD) {
        await bankSyncRepository.update(sync.id, {
            ...baseUpdate,
            backwardSyncedAt: nextBackwardSyncedAt,
            backwardSyncFromAt: result.nextTo
        });

        return;
    }

    await bankSyncRepository.update(sync.id, { ...baseUpdate, forwardSyncFromAt: result.nextFrom });
};
