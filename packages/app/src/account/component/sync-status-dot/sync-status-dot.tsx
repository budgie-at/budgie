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
            [SyncStatusEnum.SYNCING]: '',
            [SyncStatusEnum.IDLE]: '',
            [SyncStatusEnum.FAILED]: ''
        },
        disabled: {
            true: 'bg-secondary-foreground',
            false: ''
        }
    },
    compoundVariants: [
        { disabled: false, status: SyncStatusEnum.SYNCING, class: 'bg-warning-foreground animate-pulse' },
        { disabled: false, status: SyncStatusEnum.IDLE, class: 'bg-positive-foreground' },
        { disabled: false, status: SyncStatusEnum.FAILED, class: 'bg-destructive-foreground' }
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
