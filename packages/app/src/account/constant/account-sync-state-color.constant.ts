import { ClassValue } from 'cn';

import { AccountSyncStateEnum } from '../enum/account-sync-state.enum';

export const ACCOUNT_SYNC_STATE_COLOR: Record<AccountSyncStateEnum, ClassValue> = {
    [AccountSyncStateEnum.SYNCED]: 'bg-positive-foreground',
    [AccountSyncStateEnum.SYNCING]: ['bg-warning-foreground', 'animate-pulse'],
    [AccountSyncStateEnum.WAITING]: 'bg-warning-foreground',
    [AccountSyncStateEnum.FAILED]: 'bg-destructive-foreground',
    [AccountSyncStateEnum.DISABLED]: 'bg-secondary-foreground'
};
