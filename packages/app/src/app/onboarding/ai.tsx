import { useLingui } from '@lingui/react/macro';

import { OnboardingPlaceholderStep } from '../../onboarding/component/onboarding-placeholder-step/onboarding-placeholder-step';
import { OnboardingStepEnum } from '../../onboarding/enum/onboarding-step.enum';

export default function OnboardingAiScreen() {
    const { t } = useLingui();

    return (
        <OnboardingPlaceholderStep
            step={OnboardingStepEnum.AI}
            title={t`Meet your AI assistant`}
            description={t`On-device AI features will be introduced from this screen.`}
        />
    );
}
