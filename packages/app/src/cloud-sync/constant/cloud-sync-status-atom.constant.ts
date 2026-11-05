import * as Atom from 'effect/reactivity/Atom';

import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';

import type { CloudSyncStatusInterface } from '../interface/cloud-sync-status.interface';

export const INITIAL_CLOUD_SYNC_STATUS: CloudSyncStatusInterface = {
    status: CloudSyncStatusEnum.IDLE,
    lastSyncedAt: null,
    fetchedRecordCount: 0,
    isInitialFetchComplete: false
};

export const cloudSyncStatusAtom = Atom.keepAlive(Atom.make(INITIAL_CLOUD_SYNC_STATUS));
