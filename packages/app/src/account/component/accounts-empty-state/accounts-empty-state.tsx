import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';

import { AccountsEmptyStateSelector } from './accounts-empty-state.selector';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' as const };

export const AccountsEmptyState = () => {
    const router = useRouter();

    const handleAddAccount = () => void router.push('/create-account');

    return (
        <View className="items-center gap-y-lg rounded-3xl bg-grouped-surface-row px-5xl py-7xl" style={CONTINUOUS_CORNERS}>
            <CircleIcon
                icon={UserIconNameEnum.Wallet}
                size={56}
                iconSize={26}
                radius={28}
                variant="secondary"
                border={false}
                className="bg-surface-disc"
            />

            <View className="items-center gap-y-xs">
                <Text
                    accessibilityRole="header"
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    className="text-center text-lg font-semibold text-primary"
                >
                    <Trans>No accounts yet</Trans>
                </Text>
                <Text maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} className="text-center text-[15px] text-secondary-foreground">
                    <Trans>Add your first account to start tracking your finances</Trans>
                </Text>
            </View>

            <Button
                variant="primary"
                size="md"
                leftIcon={UserIconNameEnum.Plus}
                onPress={handleAddAccount}
                content={<Trans>Add Account</Trans>}
                testID={AccountsEmptyStateSelector.AddAccountButton}
            />
        </View>
    );
};
