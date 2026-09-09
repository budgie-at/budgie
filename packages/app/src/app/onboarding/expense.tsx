import { useLingui } from '@lingui/react/macro';

import { OnboardingPlaceholderStep } from '../../onboarding/component/onboarding-placeholder-step/onboarding-placeholder-step';
import { OnboardingStepEnum } from '../../onboarding/enum/onboarding-step.enum';

export default function OnboardingExpenseScreen() {
    const { t } = useLingui();

    return (
        <OnboardingPlaceholderStep
            step={OnboardingStepEnum.EXPENSE}
            title={t`Log your first expense`}
            description={t`A quick walkthrough of logging a transaction is coming to this screen.`}
        />
    );
}
