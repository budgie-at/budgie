import { CloudSyncStatusEnum } from '@budgie/cloud-sync';
import * as Atom from 'effect/reactivity/Atom';

import type { CloudSyncStatusInterface } from '@budgie/cloud-sync';

const INITIAL_CLOUD_SYNC_STATUS: CloudSyncStatusInterface = {
    status: CloudSyncStatusEnum.IDLE,
    lastSyncedAt: null,
    fetchedRecordCount: 0,
    isInitialFetchComplete: false,
    isQuotaExceeded: false
};

export const cloudSyncStatusAtom = Atom.keepAlive(Atom.make(INITIAL_CLOUD_SYNC_STATUS));
