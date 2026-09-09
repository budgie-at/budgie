import { useLingui } from '@lingui/react/macro';

import { OnboardingPlaceholderStep } from '../../onboarding/component/onboarding-placeholder-step/onboarding-placeholder-step';
import { OnboardingStepEnum } from '../../onboarding/enum/onboarding-step.enum';

export default function OnboardingLockScreen() {
    const { t } = useLingui();

    return (
        <OnboardingPlaceholderStep
            step={OnboardingStepEnum.LOCK}
            title={t`Lock it down`}
            description={t`PIN and biometric protection will be configurable from this screen.`}
        />
    );
}
