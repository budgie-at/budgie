import { AccountEntityInterface, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useAccountBankSync } from '../../../sync/hook/use-account-bank-sync.hook';
import { useErsteQuickImport } from '../../../sync/hook/use-erste-quick-import.hook';
import { usePrivatbankQuickImport } from '../../../sync/hook/use-privatbank-quick-import.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

const syncStatusVariants = cva('absolute bottom-3 right-3 size-2 rounded-full will-change-animation', {
    variants: {
        status: {
            [BankSyncStatusEnum.SYNCING]: 'bg-amber-500 animate-pulse',
            [BankSyncStatusEnum.IDLE]: 'bg-green-500',
            [BankSyncStatusEnum.FAILED]: 'bg-destructive'
        }
    }
});

export const BankSyncAccountCard = (props: Props) => {
    const { id, title, icon, className, instrumentSymbol } = props;

    const [, hapticImpact] = useVibration();
    const { bankSync } = useAccountBankSync(id);
    const { handleQuickImport } = usePrivatbankQuickImport();
    const { handleQuickImport: handleErsteQuickImport } = useErsteQuickImport();

    const shouldShow = isDefined(bankSync);
    const isPrivatbank = isDefined(bankSync) && bankSync.provider === ExternalSourceEnum.PRIVATBANK;
    const isErste = isDefined(bankSync) && bankSync.provider === ExternalSourceEnum.ERSTE;

    const handleLongPress = () => {
        if (isPrivatbank) {
            hapticImpact(ImpactFeedbackStyle.Medium);
            handleQuickImport();
        }

        if (isErste) {
            hapticImpact(ImpactFeedbackStyle.Medium);
            handleErsteQuickImport();
        }
    };

    const longPressHandler = isPrivatbank || isErste ? handleLongPress : emptyFn;
    const statusClassName = shouldShow
        ? syncStatusVariants({ status: bankSync.status })
        : syncStatusVariants({ status: BankSyncStatusEnum.IDLE });
    const statusStyle = { opacity: shouldShow ? 1 : 0 };

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            instrumentSymbol={instrumentSymbol}
            className={className}
            onLongPress={longPressHandler}
        >
            <View className={statusClassName} style={statusStyle} />
        </AccountCardBase>
    );
};
