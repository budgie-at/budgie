import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { BudgieLogo } from '../../../@generic/component/budgie-logo/budgie-logo';

export const OnboardingWelcomeHero = () => (
    <View className="items-center gap-y-xs">
        <BudgieLogo size={72} />
        <View className="items-center gap-y-lg">
            <Text allowFontScaling={false} className="text-primary text-[48px] font-bold tracking-tight text-center">
                <Trans>Budgie</Trans>
            </Text>
            <View className="items-center">
                <Text className="text-primary text-lg font-medium text-center">
                    <Trans>Your money in one file.</Trans>
                </Text>
                <Text className="text-secondary-foreground text-lg text-center">
                    <Trans>Only you hold the key.</Trans>
                </Text>
            </View>
        </View>
    </View>
);
