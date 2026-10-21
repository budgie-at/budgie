import { SyncEntityInterface, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { AccountSyncStateEnum } from '../enum/account-sync-state.enum';

export const getAccountSyncState = (sync: Pick<SyncEntityInterface, 'enabled' | 'status' | 'mode'> | null): AccountSyncStateEnum | null => {
    if (!isDefined(sync)) {
        return null;
    }

    if (!sync.enabled) {
        return AccountSyncStateEnum.DISABLED;
    }

    if (sync.status === SyncStatusEnum.SYNCING) {
        return AccountSyncStateEnum.SYNCING;
    }

    if (sync.status === SyncStatusEnum.FAILED) {
        return AccountSyncStateEnum.FAILED;
    }

    return sync.mode === SyncModeEnum.FORWARD ? AccountSyncStateEnum.SYNCED : AccountSyncStateEnum.WAITING;
};
