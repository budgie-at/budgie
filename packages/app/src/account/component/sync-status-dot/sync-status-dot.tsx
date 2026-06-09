import { BankSyncEntityInterface, BankSyncStatusEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly bankSync: BankSyncEntityInterface | null;
}

const syncStatusVariants = cva('absolute bottom-3 right-3 z-10 h-2 w-2 rounded-full will-change-animation', {
    variants: {
        status: {
            [BankSyncStatusEnum.SYNCING]: 'bg-warning-foreground animate-pulse',
            [BankSyncStatusEnum.IDLE]: 'bg-positive-foreground',
            [BankSyncStatusEnum.FAILED]: 'bg-destructive'
        },
        disabled: {
            true: 'bg-secondary-foreground',
            false: ''
        }
    },
    compoundVariants: [
        { disabled: true, status: BankSyncStatusEnum.SYNCING, class: 'bg-secondary-foreground' },
        { disabled: true, status: BankSyncStatusEnum.IDLE, class: 'bg-secondary-foreground' },
        { disabled: true, status: BankSyncStatusEnum.FAILED, class: 'bg-secondary-foreground' }
    ]
});

export const SyncStatusDot = ({ bankSync }: Props) => {
    const shouldShow = isDefined(bankSync);
    const isDisabled = shouldShow && !bankSync.enabled;
    const status = shouldShow ? bankSync.status : BankSyncStatusEnum.IDLE;
    const statusClassName = syncStatusVariants({ status, disabled: isDisabled });
    const statusStyle = { opacity: shouldShow ? 1 : 0 };

    return <View className={statusClassName} style={statusStyle} />;
};
