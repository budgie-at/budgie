import { useLingui } from '@lingui/react/macro';

import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

interface Props {
    readonly step: OnboardingStepEnum;
    readonly title: string;
    readonly description: string;
}

export const OnboardingPlaceholderStep = ({ step, title, description }: Props) => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();

    const handlePrimary = () => void goToNextStep(step);

    return (
        <OnboardingStepLayout step={step} title={title} description={description} primaryLabel={t`Continue`} onPrimary={handlePrimary}>
            {null}
        </OnboardingStepLayout>
    );
};
