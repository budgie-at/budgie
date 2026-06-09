import { BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';

export const handleBankSyncError = async (
    error: unknown,
    provider: ExternalSourceEnum,
    rateLimitMs: number,
    retrySyncLoop: () => Promise<BackgroundTask.BackgroundTaskResult>
): Promise<BackgroundTask.BackgroundTaskResult> => {
    const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
    const enabledSyncs = await bankSyncRepository.getEnabledByProvider(provider);
    if (!isNotEmptyArray(enabledSyncs)) {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    const syncToRetry = enabledSyncs.find(sync => sync.errorCount < SYNC_ERROR_THRESHOLD);
    if (isDefined(syncToRetry)) {
        await bankSyncRepository.recordError(syncToRetry.id, errorMessage);
        await microPause(rateLimitMs);

        return retrySyncLoop();
    }

    await Promise.all(
        enabledSyncs.map(sync =>
            bankSyncRepository.update(sync.id, { status: BankSyncStatusEnum.FAILED, lastError: errorMessage, enabled: false })
        )
    );

    return BackgroundTask.BackgroundTaskResult.Failed;
};
