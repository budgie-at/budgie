import { BankProviderEnum } from '@budgie/bank-sync';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BankLogo } from '../../../@generic/components/bank-logo/bank-logo';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { SyncStatusEnum } from '../../enum/sync-status.enum';
import { useBankSyncState } from '../../hook/use-bank-sync-state.hook';

const getStatusConfig = (status: SyncStatusEnum) => {
    switch (status) {
        case SyncStatusEnum.SUCCESS:
            return {
                bgColor: 'bg-green-500/10',
                borderColor: 'border-green-500/20'
            };
        case SyncStatusEnum.FAILED:
            return {
                bgColor: 'bg-red-500/10',
                borderColor: 'border-red-500/20'
            };
        default:
            return {
                bgColor: 'bg-primary/5',
                borderColor: 'border-primary/10'
            };
    }
};

export const SyncProgressBadge = () => {
    const { t } = useLingui();

    const state = useBankSyncState(BankProviderEnum.MONOBANK);
    const canDismiss = state.status === SyncStatusEnum.SUCCESS || state.status === SyncStatusEnum.FAILED;

    const [isVisible, setIsVisible] = useState(true);

    const config = getStatusConfig(state.status);

    const stepText = () => {
        switch (state.status) {
            case SyncStatusEnum.SYNCING:
                return t`Syncing transactions...`;
            case SyncStatusEnum.SUCCESS:
                return t`Sync completed successfully`;
            case SyncStatusEnum.FAILED:
                return t`Sync failed`;
            default:
                return '';
        }
    };

    const handlePress = () => {
        if (canDismiss) {
            setIsVisible(false);
        }
    };

    const { totalTransactions, enabled } = state;

    if (!enabled || state.status === SyncStatusEnum.IDLE || !isVisible) {
        return null;
    }

    return (
        <Pressable onPress={handlePress} className={`rounded-2xl border ${config.bgColor} ${config.borderColor} p-4 px-4 mt-4 mb-8`}>
            <View className="flex-row items-center gap-3">
                <BankLogo bankProvider={BankProviderEnum.MONOBANK} />
                <View className="flex-1">
                    <Text className="text-primary text-foreground font-medium text-sm" numberOfLines={2}>
                        {stepText()}
                    </Text>
                    {totalTransactions > 0 && (
                        <Text className="text-primary text-muted-foreground text-xs mt-0.5">{t`${totalTransactions} transactions synced`}</Text>
                    )}
                </View>
                {canDismiss && <Icon icon={ICONS.X} className="text-muted-foreground" size="sm" />}
            </View>
        </Pressable>
    );
};
