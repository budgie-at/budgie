import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { OnboardingWelcomeSelector } from '../onboarding-welcome/onboarding-welcome.selector';

interface Props {
    readonly onStart: () => void;
}

export const OnboardingWelcomeActions = ({ onStart }: Props) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-lg">
            <PillButton testID={OnboardingWelcomeSelector.StartButton} label={t`Get started`} onPress={onStart} />
            <Text className="text-secondary-foreground text-[13px] text-center" maxFontSizeMultiplier={1.6}>
                <Trans>No account needed · Takes about a minute</Trans>
            </Text>
        </View>
    );
};
