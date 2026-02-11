import { AccountEntityInterface, BankSyncStatusEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { quickImportConfigMap } from '../../../sync/constant/quick-import-config-map.constant';
import { useAccountBankSync } from '../../../sync/hook/use-account-bank-sync.hook';
import { useQuickImport } from '../../../sync/hook/use-quick-import.hook';
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

    const shouldShow = isDefined(bankSync);
    const quickImportConfig = isDefined(bankSync) ? (quickImportConfigMap[bankSync.provider] ?? null) : null;
    const { handleQuickImport } = useQuickImport(quickImportConfig);

    const handleLongPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        handleQuickImport();
    };

    const longPressHandler = isDefined(quickImportConfig) ? handleLongPress : emptyFn;
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
