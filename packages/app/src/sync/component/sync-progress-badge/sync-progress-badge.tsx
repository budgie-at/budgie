import { BankProviderEnum } from '@budgie/bank-sync';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { BankLogo } from '../../../@generic/components/bank-logo/bank-logo';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { SyncStatusEnum } from '../../enum/sync-status.enum';
import { SyncStepEnum } from '../../enum/sync-step.enum';
import { useBankSyncState } from '../../hook/use-bank-sync-state.hook';
import { bankSyncStorageService } from '../../service/bank-sync-storage.service';

const ANIMATION_DURATION = 300;
const PROGRESS_ANIMATION_DURATION = 200;
const CARD_HEIGHT = 100;

const styles = StyleSheet.create({
    container: { overflow: 'hidden' }
});

const getStatusConfig = (status: SyncStatusEnum) => {
    switch (status) {
        case SyncStatusEnum.SUCCESS:
            return {
                icon: ICONS.CheckCircle,
                iconColor: 'text-green-500',
                bgColor: 'bg-green-500/10',
                borderColor: 'border-green-500/20',
                progressColor: 'bg-green-500'
            };
        case SyncStatusEnum.ERROR:
            return {
                icon: ICONS.AlertCircle,
                iconColor: 'text-red-500',
                bgColor: 'bg-red-500/10',
                borderColor: 'border-red-500/20',
                progressColor: 'bg-red-500'
            };
        default:
            return {
                icon: ICONS.RefreshCw,
                iconColor: 'text-primary',
                bgColor: 'bg-primary/5',
                borderColor: 'border-primary/10',
                progressColor: 'bg-primary'
            };
    }
};

// eslint-disable-next-line max-statements
export const SyncProgressBadge = () => {
    const { t } = useLingui();
    const { state, isSyncing } = useBankSyncState(BankProviderEnum.MONOBANK);
    const { progress } = state;

    const animatedHeight = useRef(new Animated.Value(0));
    const animatedProgress = useRef(new Animated.Value(0));

    const percentage = progress.totalAccounts > 0 ? (progress.currentAccount / progress.totalAccounts) * 100 : 0;
    const isVisible = isSyncing || progress.status === SyncStatusEnum.SUCCESS || progress.status === SyncStatusEnum.ERROR;
    const canDismiss = progress.status === SyncStatusEnum.SUCCESS || progress.status === SyncStatusEnum.ERROR;
    const config = getStatusConfig(progress.status);

    const stepText = () => {
        switch (progress.step) {
            case SyncStepEnum.SYNCING_ACCOUNTS:
                return t`Syncing accounts...`;
            case SyncStepEnum.SYNCING_TRANSACTIONS:
                return t`Syncing transactions...`;
            case SyncStepEnum.COMPLETED:
                return t`Sync completed successfully`;
            case SyncStepEnum.ERROR:
                return progress.error ?? t`Sync failed`;
            default:
                return '';
        }
    };

    useEffect(() => {
        Animated.timing(animatedHeight.current, {
            toValue: isVisible ? 1 : 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: false
        }).start();
    }, [isVisible]);

    useEffect(() => {
        Animated.timing(animatedProgress.current, {
            toValue: percentage,
            duration: PROGRESS_ANIMATION_DURATION,
            useNativeDriver: false
        }).start();
    }, [percentage]);

    const heightStyle = {
        ...styles.container,
        height: animatedHeight.current.interpolate({ inputRange: [0, 1], outputRange: [0, CARD_HEIGHT] }),
        marginBottom: animatedHeight.current.interpolate({ inputRange: [0, 1], outputRange: [0, 16] })
    };

    const handlePress = () => {
        if (canDismiss) {
            bankSyncStorageService.resetSync(BankProviderEnum.MONOBANK);
        }
    };

    const { totalTransactions } = progress;

    return (
        <Animated.View style={heightStyle}>
            <Pressable onPress={handlePress} className={`rounded-2xl border ${config.bgColor} ${config.borderColor} p-4`}>
                <View className="flex-row items-center gap-3">
                    <BankLogo bankProvider={BankProviderEnum.MONOBANK} />
                    <View className="flex-1">
                        <Text className="text-primary text-foreground font-medium text-sm" numberOfLines={2}>
                            {stepText()}
                        </Text>
                        {totalTransactions > 0 && isSyncing && (
                            <Text className="text-primary text-muted-foreground text-xs mt-0.5">{t`${totalTransactions} transactions synced`}</Text>
                        )}
                    </View>
                    {canDismiss && <Icon icon={ICONS.X} className="text-muted-foreground" size="sm" />}
                </View>
            </Pressable>
        </Animated.View>
    );
};
