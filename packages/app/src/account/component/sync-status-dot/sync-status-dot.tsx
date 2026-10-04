import { SyncEntityInterface, SyncStatusEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly sync: SyncEntityInterface | null;
}

const syncStatusVariants = cva('h-2 w-2 rounded-full will-change-animation', {
    variants: {
        status: {
            [SyncStatusEnum.SYNCING]: 'bg-warning-foreground animate-pulse',
            [SyncStatusEnum.IDLE]: 'bg-positive-foreground',
            [SyncStatusEnum.FAILED]: 'bg-destructive-foreground'
        }
    }
});

export const SyncStatusDot = ({ sync }: Props) => {
    const shouldShow = isDefined(sync);
    const isDisabled = shouldShow && !sync.enabled;
    const status = shouldShow ? sync.status : SyncStatusEnum.IDLE;
    const statusClassName = cn(syncStatusVariants({ status }), isDisabled && 'bg-secondary-foreground');
    const statusStyle = { opacity: shouldShow ? 1 : 0 };

    return <View className={statusClassName} style={statusStyle} />;
};
