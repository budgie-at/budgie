import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { BudgieLogo } from '../../../@generic/component/budgie-logo/budgie-logo';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';

import { OnboardingWelcomeSelector } from './onboarding-welcome.selector';

export const OnboardingWelcome = () => {
    const { t } = useLingui();
    const { goToStep } = useOnboardingNavigation();

    const handleStartPress = () => void goToStep(OnboardingStepEnum.KEY);
    const contentContainerStyle = {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
        rowGap: 48
    } as const;

    return (
        <GroupedSurface testID={OnboardingWelcomeSelector.Root}>
            <ScrollView className="flex-1 pt-safe pb-safe" contentContainerStyle={contentContainerStyle}>
                <View className="items-center gap-y-lg">
                    <BudgieLogo size={72} />

                    <View className="items-center gap-y-lg">
                        <Text className="text-primary text-[48px] font-bold tracking-tight text-center">{t`Budgie`}</Text>

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

                <View className="gap-y-lg">
                    <PillButton testID={OnboardingWelcomeSelector.StartButton} label={t`Get started`} onPress={handleStartPress} />

                    <Text className="text-secondary-foreground text-[13px] text-center">
                        <Trans>No account needed · Takes about a minute</Trans>
                    </Text>
                </View>
            </ScrollView>
        </GroupedSurface>
    );
};
