import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FullPage } from '../../../@generic/component/page/full-page';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { onboardingService } from '../../service/onboarding.service';
import { OnboardingChip } from '../onboarding-chip/onboarding-chip';

import { OnboardingWelcomeSelector } from './onboarding-welcome.selector';

const logger = getLogger('OnboardingWelcome');

export const OnboardingWelcome = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();

    const handlePrimary = () => void goToNextStep(OnboardingStepEnum.WELCOME);

    const handleBlankCanvasPress = () => {
        void onboardingService
            .complete()
            .then(() => void router.replace('/'))
            .catch((error: unknown) => {
                logger.error('blank canvas failed', { errorMessage: getErrorMessage(error) });
            });
    };

    return (
        <FullPage testID={OnboardingWelcomeSelector.Root} className="bg-background">
            <View className="flex-1 justify-center gap-y-lg">
                <Text className="text-primary text-4xl font-semibold leading-tight tracking-tight text-left">
                    {t`Your money. Your phone. Nobody else's server.`}
                </Text>

                <Text className="text-secondary-foreground text-md leading-relaxed text-left">
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
