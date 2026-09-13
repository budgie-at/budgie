import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';
import { OnboardingSuccessRow } from '../onboarding-success-row/onboarding-success-row';

import { OnboardingBudgetSelector } from './onboarding-budget.selector';

export const OnboardingBudget = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();
    const { budget } = useGetActiveBudgetQuery();

    const hasBudget = isDefined(budget);

    const handleCreateBudgetPress = () => void router.push('/budget/create');
    const handlePrimary = () => void goToNextStep(OnboardingStepEnum.BUDGET);

    const primaryLabel = hasBudget ? t`Continue` : t`Set a budget`;
    const handlePrimaryPress = hasBudget ? handlePrimary : handleCreateBudgetPress;

    const stepContent = hasBudget ? (
        <OnboardingSuccessRow label={t`Monthly budget set`} testID={OnboardingBudgetSelector.SuccessRow} />
    ) : null;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.BUDGET}
            icon={UserIconNameEnum.PiggyBank}
            title={t`Set a monthly ceiling`}
            description={t`Budgie warns you before you cross it, and shows what's left right on the home screen.`}
            primaryLabel={primaryLabel}
            onPrimary={handlePrimaryPress}
        >
            {stepContent}
        </OnboardingStepLayout>
    );
};
