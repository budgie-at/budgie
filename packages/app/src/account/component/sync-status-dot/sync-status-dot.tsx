import { SyncEntityInterface, SyncStatusEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly sync: SyncEntityInterface | null;
}

const syncStatusVariants = cva('h-2 w-2 rounded-full will-change-animation', {
    variants: {
        status: {
            [SyncStatusEnum.SYNCING]: 'bg-warning-foreground animate-pulse',
            [SyncStatusEnum.IDLE]: 'bg-positive-foreground',
            [SyncStatusEnum.FAILED]: 'bg-destructive'
        },
        disabled: {
            true: 'bg-secondary-foreground',
            false: ''
        }
    },
    compoundVariants: [
        { disabled: true, status: SyncStatusEnum.SYNCING, class: 'bg-secondary-foreground' },
        { disabled: true, status: SyncStatusEnum.IDLE, class: 'bg-secondary-foreground' },
        { disabled: true, status: SyncStatusEnum.FAILED, class: 'bg-secondary-foreground' }
    ]
});

export const SyncStatusDot = ({ sync }: Props) => {
    const shouldShow = isDefined(sync);
    const isDisabled = shouldShow && !sync.enabled;
    const status = shouldShow ? sync.status : SyncStatusEnum.IDLE;
    const statusClassName = syncStatusVariants({ status, disabled: isDisabled });
    const statusStyle = { opacity: shouldShow ? 1 : 0 };

    return <View className={statusClassName} style={statusStyle} />;
};
