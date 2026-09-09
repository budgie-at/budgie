import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { getErrorMessage } from '@rnw-community/shared';

import { OnboardingStepLayout } from '../../onboarding/component/onboarding-step-layout/onboarding-step-layout';
import { OnboardingStepEnum } from '../../onboarding/enum/onboarding-step.enum';
import { onboardingService } from '../../onboarding/service/onboarding.service';

const logger = getLogger('OnboardingDoneScreen');

export default function OnboardingDoneScreen() {
    const { t } = useLingui();

    const handlePrimary = () => {
        void onboardingService
            .complete()
            .then(() => void router.replace('/'))
            .catch((error: unknown) => {
                logger.error('finish onboarding failed', { errorMessage: getErrorMessage(error) });
            });
    };

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.DONE}
            title={t`You're all set`}
            description={t`Budgie is ready to go. You can revisit any of these steps later from Settings.`}
            primaryLabel={t`Finish`}
            onPrimary={handlePrimary}
        >
            {null}
        </OnboardingStepLayout>
    );
}
