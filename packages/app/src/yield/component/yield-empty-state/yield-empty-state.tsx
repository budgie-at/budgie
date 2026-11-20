import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

export const YieldEmptyState = () => {
    const { t } = useLingui();

    const handleConnect = () => void router.push('/create-account');
    const handleAddDeposit = () => void router.push({ pathname: '/create-account/[type]', params: { type: AccountTypeEnum.DEPOSIT } });
    const handleExplain = () => void router.push('/passive-income-info');

    return (
        <View className="flex-1 justify-center gap-y-xl px-5xl" testID={PassiveIncomeSelector.EmptyState}>
            <EmptyState
                icon={UserIconNameEnum.Sprout}
                title={t`No passive income yet`}
                titleClassName="text-center text-xl font-semibold text-primary"
                description={t`Staking rewards, dividends and interest appear here once you have them.`}
                descriptionClassName="text-center text-[15px] text-secondary-foreground"
            />
            <Button content={t`Connect an exchange`} leftIcon={UserIconNameEnum.Link} onPress={handleConnect} variant="cta" />
            <Button content={t`Add a deposit`} leftIcon={UserIconNameEnum.PiggyBank} onPress={handleAddDeposit} variant="ghost" />
            <HapticPressable onPress={handleExplain} accessibilityRole="link" className="min-h-[44px] items-center justify-center">
                <Text className="text-[15px] text-positive-action">
                    <Trans>About these figures</Trans>
                </Text>
            </HapticPressable>
        </View>
    );
};
