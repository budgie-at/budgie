import { ExternalSourceEnum } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';

import { isNotEmptyArray } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';

import { handleBankSyncError } from './handle-bank-sync-error.util';

export const runBankSyncLoop = async (
    provider: ExternalSourceEnum,
    rateLimitMs: number,
    processPendingSyncs: () => Promise<BackgroundTask.BackgroundTaskResult>,
    beforeProcess?: (firstSyncToken: string) => Promise<void>
): Promise<BackgroundTask.BackgroundTaskResult> => {
    try {
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        await beforeProcess?.(enabledSyncs[0].token);

        return await processPendingSyncs();
    } catch (error: unknown) {
        return handleBankSyncError(error, provider, rateLimitMs, () =>
            runBankSyncLoop(provider, rateLimitMs, processPendingSyncs, beforeProcess)
        );
    }
};
