import { useLingui } from '@lingui/react/macro';

import { OnboardingPlaceholderStep } from '../../onboarding/component/onboarding-placeholder-step/onboarding-placeholder-step';
import { OnboardingStepEnum } from '../../onboarding/enum/onboarding-step.enum';

export default function OnboardingBalancesScreen() {
    const { t } = useLingui();

    return (
        <OnboardingPlaceholderStep
            step={OnboardingStepEnum.BALANCES}
            title={t`Add your balances`}
            description={t`We'll let you set starting balances for each account here soon.`}
        />
    );
}
