import { isDefined } from '@rnw-community/shared';

import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';

let syncModule: typeof import('@budgie/sync') | null = null;
let syncModulePromise: Promise<typeof import('@budgie/sync')> | null = null;

export const loadSyncModule = (): Promise<typeof import('@budgie/sync')> => {
    if (!isDefined(syncModulePromise)) {
        syncModulePromise = import('@budgie/sync').then(bankSyncModule => {
            syncModule = bankSyncModule;

            return bankSyncModule;
        });
    }

    return syncModulePromise;
};

export const getSyncModule = (): typeof import('@budgie/sync') => {
    if (!isDefined(syncModule)) {
        throw new Error(UNKNOWN_SYNC_ERROR);
    }

    return syncModule;
};
