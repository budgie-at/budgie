import { useLingui } from '@lingui/react/macro';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { MONOBANK_LOGO } from '../../../../account/constant/monobank-logo.constant';
import { Icon } from '../../../components/icon/icon';
import { ICONS } from '../../../constant/icons.constant';
import { SyncStatusEnum } from '../../enum/sync-status.enum';
import { SyncStepEnum } from '../../enum/sync-step.enum';
import { useSyncContext } from '../../provider/sync.provider';

const ANIMATION_DURATION = 300;
const PROGRESS_ANIMATION_DURATION = 200;
const CARD_HEIGHT = 88;
const ICON_SIZE = 24;

const styles = StyleSheet.create({
    container: { overflow: 'hidden' },
    monobankIcon: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: 6 }
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
export const SyncProgressBar = () => {
    const { t } = useLingui();
    const { progress, isSyncing, resetSync } = useSyncContext();

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
                return t`Syncing Monobank...`;
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

    const heightStyle = useMemo(
        () => ({
            ...styles.container,
            height: animatedHeight.current.interpolate({ inputRange: [0, 1], outputRange: [0, CARD_HEIGHT] }),
            marginBottom: animatedHeight.current.interpolate({ inputRange: [0, 1], outputRange: [0, 16] })
        }),
        []
    );

    const widthStyle = useMemo(
        () => ({ width: animatedProgress.current.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }),
        []
    );

    const handlePress = canDismiss ? resetSync : void 0;

    const { totalAccounts, currentAccount } = progress;
    const showMonobankIcon = isSyncing || progress.step === SyncStepEnum.SYNCING_TRANSACTIONS;

    const renderIcon = () => {
        if (showMonobankIcon) {
            return <Image source={MONOBANK_LOGO} style={styles.monobankIcon} />;
        }

        return <Icon icon={config.icon} className={config.iconColor} size="sm" />;
    };

    return (
        <Animated.View style={heightStyle}>
            <Pressable onPress={handlePress} className={`rounded-2xl border ${config.bgColor} ${config.borderColor} p-4`}>
                <View className="flex-row items-center gap-3">
                    <View className={`w-10 h-10 rounded-full ${config.bgColor} items-center justify-center`}>{renderIcon()}</View>
                    <View className="flex-1">
                        <Text className="text-foreground font-medium text-sm" numberOfLines={1}>
                            {stepText}
                        </Text>
                        {totalAccounts > 0 && isSyncing && (
                            <Text className="text-muted-foreground text-xs mt-0.5">
                                {t`${currentAccount} of ${totalAccounts} accounts`}
                            </Text>
                        )}
                    </View>
                    {canDismiss && <Icon icon={ICONS.X} className="text-muted-foreground" size="sm" />}
                </View>
                {isSyncing && (
                    <View className="h-1 bg-muted/50 rounded-full overflow-hidden mt-3">
                        <Animated.View style={widthStyle} className={`h-full rounded-full ${config.progressColor}`} />
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
};
