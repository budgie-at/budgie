import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { AccountSyncStateEnum } from '../../enum/account-sync-state.enum';

interface Props {
    readonly state: AccountSyncStateEnum;
}

const syncBadgeVariants = cva('absolute -bottom-[2px] -right-[2px] size-[12px] rounded-full border-2 border-primary-reverse', {
    variants: {
        state: {
            [AccountSyncStateEnum.SYNCED]: 'bg-positive-foreground',
            [AccountSyncStateEnum.SYNCING]: 'bg-warning-foreground animate-pulse',
            [AccountSyncStateEnum.FAILED]: 'bg-destructive-foreground',
            [AccountSyncStateEnum.DISABLED]: 'bg-secondary-foreground'
        }
    }
});

export const AccountSyncBadge = ({ state }: Props) => <View className={syncBadgeVariants({ state })} />;
