import { DEFAULT_TRANSACTION_FILTER, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useGetTransactionCountQuery } from '../../../transaction/query/use-get-transaction-count.query';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingExpenseSelector } from './onboarding-expense.selector';

const SUCCESS_ICON_SIZE = 40;
const SUCCESS_ICON_INNER_SIZE = 20;

export const OnboardingExpense = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();
    const { count } = useGetTransactionCountQuery(DEFAULT_TRANSACTION_FILTER);

    const hasFirstExpense = isPositiveNumber(count);

    const handleAddExpensePress = () => void router.push('/create-transaction/expense');
    const handlePrimary = () => void goToNextStep(OnboardingStepEnum.EXPENSE);

    const primaryLabel = hasFirstExpense ? t`Continue` : t`Add my first expense`;
    const handlePrimaryPress = hasFirstExpense ? handlePrimary : handleAddExpensePress;

    const hintContent = (
        <Text className="text-secondary-foreground text-sm leading-relaxed">
            <Trans>Tap below to log your first transaction. Budgie will pick the account and suggest a category for you.</Trans>
        </Text>
    );

    const successContent = (
        <View
            {...testID(OnboardingExpenseSelector.SuccessRow)}
            className="flex-row items-center gap-x-md rounded-3xl border border-secondary-corner/50 bg-secondary-background p-3xl"
        >
            <CircleIcon
                icon={UserIconNameEnum.CircleCheck}
                variant="positive"
                border={false}
                size={SUCCESS_ICON_SIZE}
                iconSize={SUCCESS_ICON_INNER_SIZE}
            />
            <Text className="text-primary text-md font-medium flex-1">
                <Trans>First expense added</Trans>
            </Text>
        </View>
    );

    const stepContent = hasFirstExpense ? successContent : hintContent;

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
