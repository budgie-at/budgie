import { AccountWithBankSyncEntityInterface, BankSyncEntityInterface, BankSyncStatusEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { quickImportConfigMap } from '../../../sync/constant/quick-import-config-map.constant';
import { useQuickImport } from '../../../sync/hook/use-quick-import.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';

const logger = getLogger('BankSyncAccountCard');

interface Props extends Pick<AccountWithBankSyncEntityInterface, 'id' | 'title' | 'icon' | 'externalId'> {
    readonly balance: number;
    readonly bankSync: BankSyncEntityInterface | null;
    readonly className?: string;
    readonly instrumentSymbol: string;
}

const syncStatusVariants = cva('absolute bottom-3 right-3 z-10 h-2 w-2 rounded-full will-change-animation', {
    variants: {
        status: {
            [BankSyncStatusEnum.SYNCING]: 'bg-warning-foreground animate-pulse',
            [BankSyncStatusEnum.IDLE]: 'bg-positive-foreground',
            [BankSyncStatusEnum.FAILED]: 'bg-destructive'
        }
    }
});

export const BankSyncAccountCard = (props: Props) => {
    const { id, title, icon, externalId, balance, className, instrumentSymbol, bankSync } = props;

    const [, hapticImpact] = useVibration();

    const shouldShow = isDefined(bankSync);
    const quickImportConfig = isDefined(bankSync) ? (quickImportConfigMap[bankSync.provider] ?? null) : null;
    const provider = isDefined(bankSync) ? bankSync.provider : null;
    const hasQuickImportConfig = isDefined(quickImportConfig);
    const { handleQuickImport, isLoading: isQuickImportLoading } = useQuickImport(quickImportConfig, externalId);

    const handleLongPress = () => {
        logger.log('quick-import:long-press', { accountId: id, externalId, title, provider, isQuickImportLoading });

        if (isQuickImportLoading) {
            logger.log('quick-import:skip-loading', { accountId: id, externalId, title, provider });

            return;
        }

        hapticImpact(ImpactFeedbackStyle.Medium);
        handleQuickImport();
        logger.log('quick-import:dispatched', { accountId: id, externalId, title, provider });
    };

    const longPressHandler = hasQuickImportConfig ? handleLongPress : emptyFn;
    const statusClassName = shouldShow
        ? syncStatusVariants({ status: bankSync.status })
        : syncStatusVariants({ status: BankSyncStatusEnum.IDLE });
    const statusStyle = { opacity: shouldShow ? 1 : 0 };

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            balance={balance}
            instrumentSymbol={instrumentSymbol}
            className={className}
            onLongPress={longPressHandler}
        >
            <View className={statusClassName} style={statusStyle} />
        </AccountCardBase>
    );
};
