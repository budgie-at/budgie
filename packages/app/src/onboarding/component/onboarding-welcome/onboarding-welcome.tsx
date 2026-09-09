import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { onboardingService } from '../../service/onboarding.service';
import { OnboardingChip } from '../onboarding-chip/onboarding-chip';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

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
        <OnboardingStepLayout
            step={OnboardingStepEnum.WELCOME}
            title={t`Your money. Your phone. Nobody else's server.`}
            description={t`No account. No sign-up. Everything lives in an encrypted database on this device.`}
            primaryLabel={t`Set up Budgie`}
            onPrimary={handlePrimary}
        >
            <View className="flex-1 justify-between">
                <View className="flex-row flex-wrap gap-x-md gap-y-md">
                    <OnboardingChip label={t`100% on-device`} />
                    <OnboardingChip label={t`No tracking`} />
                    <OnboardingChip label={t`Works offline`} />
                </View>

                <Button
                    testID={OnboardingWelcomeSelector.BlankCanvasButton}
                    variant="ghost"
                    content={t`Start with a blank canvas`}
                    onPress={handleBlankCanvasPress}
                />
            </View>
        </OnboardingStepLayout>
    );
};
