import { SyncEntityInterface, SyncStatusEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly bankSync: SyncEntityInterface | null;
}

const syncStatusVariants = cva('absolute bottom-3 right-3 z-10 h-2 w-2 rounded-full will-change-animation', {
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

export const SyncStatusDot = ({ bankSync }: Props) => {
    const shouldShow = isDefined(bankSync);
    const isDisabled = shouldShow && !bankSync.enabled;
    const status = shouldShow ? bankSync.status : SyncStatusEnum.IDLE;
    const statusClassName = syncStatusVariants({ status, disabled: isDisabled });
    const statusStyle = { opacity: shouldShow ? 1 : 0 };

    return <View className={statusClassName} style={statusStyle} />;
};
