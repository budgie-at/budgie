import { useLingui } from '@lingui/react/macro';

import { OnboardingPlaceholderStep } from '../../onboarding/component/onboarding-placeholder-step/onboarding-placeholder-step';
import { OnboardingStepEnum } from '../../onboarding/enum/onboarding-step.enum';

export default function OnboardingBudgetScreen() {
    const { t } = useLingui();

    return (
        <OnboardingPlaceholderStep
            step={OnboardingStepEnum.BUDGET}
            title={t`Set a monthly budget`}
            description={t`Budget setup arrives on this screen in an upcoming release.`}
        />
    );
}
