import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { useInzhurSetupQuery } from '../../query/use-inzhur-setup.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const InzhurImportSummaryFooter = () => {
    const { t } = useLingui();
    const { setup } = useInzhurSetupQuery();

    const handleDone = () => void router.dismissTo('/');
    const handleViewTransactions = () => {
        if (isDefined(setup)) {
            router.replace({ pathname: '/institution/[id]', params: { id: String(setup.integration.id) } });
        }
    };

    return (
        <View className="gap-y-xs bg-surface px-5xl pt-xs">
            <HapticPressable
                accessibilityRole="button"
                className="min-h-[44px] items-center justify-center active:opacity-70"
                testID={InzhurSelector.ViewTransactionsButton}
                onPress={handleViewTransactions}
            >
                <Text className="text-[17px] font-semibold text-default-foreground">
                    <Trans>View transactions</Trans>
                </Text>
            </HapticPressable>
            <PillButton label={t`Done`} testID={InzhurSelector.DoneButton} onPress={handleDone} />
        </View>
    );
};
