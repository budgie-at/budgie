import { AccountWithBankSyncEntityInterface, BankSyncEntityInterface, BankSyncStatusEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { quickImportConfigMap } from '../../../sync/constant/quick-import-config-map.constant';
import { useQuickImport } from '../../../sync/hook/use-quick-import.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props extends Pick<AccountWithBankSyncEntityInterface, 'id' | 'title' | 'icon'> {
    readonly bankSync: BankSyncEntityInterface | null;
    readonly className?: string;
    readonly instrumentSymbol: string;
}

const syncStatusVariants = cva('h-2 w-2 rounded-full will-change-animation', {
    variants: {
        status: {
            [BankSyncStatusEnum.SYNCING]: 'bg-warning-foreground animate-pulse',
            [BankSyncStatusEnum.IDLE]: 'bg-positive-foreground',
            [BankSyncStatusEnum.FAILED]: 'bg-destructive'
        }
    }
});

export const BankSyncAccountCard = (props: Props) => {
    const { id, title, icon, className, instrumentSymbol, bankSync } = props;

    const [, hapticImpact] = useVibration();

    const shouldShow = isDefined(bankSync);
    const quickImportConfig = isDefined(bankSync) ? (quickImportConfigMap[bankSync.provider] ?? null) : null;
    const { handleQuickImport } = useQuickImport(quickImportConfig);

    const handleLongPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        handleQuickImport();
    };

    const longPressHandler = isDefined(quickImportConfig) ? handleLongPress : emptyFn;
    const statusIndicator = shouldShow ? <View className={syncStatusVariants({ status: bankSync.status })} /> : null;

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            instrumentSymbol={instrumentSymbol}
            className={className}
            onLongPress={longPressHandler}
            topRight={statusIndicator}
        />
    );
};
