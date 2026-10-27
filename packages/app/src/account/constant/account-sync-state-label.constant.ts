import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { AccountSyncStateEnum } from '../enum/account-sync-state.enum';

export const ACCOUNT_SYNC_STATE_LABEL: Record<AccountSyncStateEnum, MessageDescriptor> = {
    [AccountSyncStateEnum.SYNCED]: msg`Up to date`,
    [AccountSyncStateEnum.SYNCING]: msg`Syncing`,
    [AccountSyncStateEnum.WAITING]: msg`Waiting`,
    [AccountSyncStateEnum.FAILED]: msg`Sync Failed`,
    [AccountSyncStateEnum.DISABLED]: msg`Sync paused`
};
