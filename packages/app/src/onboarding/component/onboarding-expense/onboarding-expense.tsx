import { DEFAULT_TRANSACTION_FILTER, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isPositiveNumber } from '@rnw-community/shared';

import { useGetTransactionCountQuery } from '../../../transaction/query/use-get-transaction-count.query';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';
import { OnboardingSuccessRow } from '../onboarding-success-row/onboarding-success-row';

import { OnboardingExpenseSelector } from './onboarding-expense.selector';

export const OnboardingExpense = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();
    const { count } = useGetTransactionCountQuery(DEFAULT_TRANSACTION_FILTER);

    const hasFirstExpense = isPositiveNumber(count);

    const handleAddExpensePress = () => void router.push('/create-transaction/expense');
    const handlePrimary = () => void goToNextStep(OnboardingStepEnum.EXPENSE);

    const primaryLabel = hasFirstExpense ? t`Continue` : t`Add my first expense`;
    const handlePrimaryPress = hasFirstExpense ? handlePrimary : handleAddExpensePress;

    const stepContent = hasFirstExpense ? (
        <OnboardingSuccessRow label={t`First expense added`} testID={OnboardingExpenseSelector.SuccessRow} />
    ) : null;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.EXPENSE}
            icon={UserIconNameEnum.Receipt}
            title={t`Add your first expense`}
            description={t`Amount first. Budgie picks the account and guesses the category.`}
            primaryLabel={primaryLabel}
            onPrimary={handlePrimaryPress}
        >
            {stepContent}
        </OnboardingStepLayout>
    );
};
