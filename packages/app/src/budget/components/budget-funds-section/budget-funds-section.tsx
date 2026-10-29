import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetFundsQuery } from '../../query/use-get-budget-funds.query';
import { BudgetFundRow } from '../budget-fund-row/budget-fund-row';
import { BudgetListSection } from '../budget-list-section/budget-list-section';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetFundsSection = ({ budget, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { funds } = useGetBudgetFundsQuery(budget.id);

    const handleAddPress = () => {
        router.push('/budget-fund-form');
    };

    const emptyHint = isEmptyArray(funds) ? (
        <Text className="text-sm text-secondary-foreground">
            <Trans>Save up for yearly bills a little each period so they never surprise you</Trans>
        </Text>
    ) : null;

    return (
        <BudgetListSection
            label={t`Set aside`}
            testID={BudgetSelector.DetailsFundsSection}
            addTestID={BudgetSelector.DetailsFundAddButton}
            onAddPress={handleAddPress}
            emptyHint={emptyHint}
        >
            {funds.map(fund => (
                <BudgetFundRow key={fund.id} fund={fund} budget={budget} currencySymbol={currencySymbol} />
            ))}
        </BudgetListSection>
    );
};
