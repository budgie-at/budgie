import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { FullPage } from '../../../@generic/component/page/full-page';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingChip } from '../onboarding-chip/onboarding-chip';

import { OnboardingWelcomeSelector } from './onboarding-welcome.selector';

export const OnboardingWelcome = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();

    const handlePrimary = () => void goToNextStep(OnboardingStepEnum.WELCOME);

    const handleBlankCanvasPress = () => {
        appRuntime.runFork(logAndContinue(Effect.flatMap(OnboardingService, onboardingService => onboardingService.complete())));
    };

    return (
        <FullPage testID={OnboardingWelcomeSelector.Root} className="bg-background">
            <View className="flex-1 justify-center gap-y-lg">
                <Text className="text-primary text-(length:--text-4xl) font-semibold tracking-tight text-left">
                    {t`Your money. Your phone. Nobody else's server.`}
                </Text>

                <Text className="text-secondary-foreground text-md text-left">
                    {t`No account. No sign-up. Everything lives in an encrypted database on this device.`}
                </Text>

                <View className="flex-row flex-wrap gap-x-md gap-y-md">
                    <OnboardingChip label={t`100% on-device`} />
                    <OnboardingChip label={t`No tracking`} />
                    <OnboardingChip label={t`Works offline`} />
                </View>
            </View>

            <View className="gap-y-md mb-5xl">
                <Button testID={OnboardingWelcomeSelector.PrimaryButton} variant="cta" content={t`Set up Budgie`} onPress={handlePrimary} />

                <Button
                    testID={OnboardingWelcomeSelector.BlankCanvasButton}
                    variant="ghost"
                    content={t`Start with a blank canvas`}
                    onPress={handleBlankCanvasPress}
                />
            </View>
        </FullPage>
    );
};
