import { SyncEntityInterface, SyncStatusEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../enum/account-sync-state.enum';

export const getAccountSyncState = (sync: Pick<SyncEntityInterface, 'enabled' | 'status'> | null): AccountSyncStateEnum | null => {
    if (!isDefined(sync)) {
        return null;
    }

    if (!sync.enabled) {
        return AccountSyncStateEnum.DISABLED;
    }

    if (sync.status === SyncStatusEnum.SYNCING) {
        return AccountSyncStateEnum.SYNCING;
    }

    return sync.status === SyncStatusEnum.FAILED ? AccountSyncStateEnum.FAILED : AccountSyncStateEnum.SYNCED;
};
