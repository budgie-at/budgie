import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsLimitCard } from '../budget-details-limit-card/budget-details-limit-card';
import { BudgetDetailsLimitHeading } from '../budget-details-limit-heading/budget-details-limit-heading';

interface Props {
    readonly categoryIds: readonly number[];
    readonly spent: number;
    readonly limitAmount: number;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
    readonly carriedAmount: number;
}

export const BudgetDetailsOtherCategoryRow = (props: Props) => {
    const { categoryIds, spent, limitAmount, periodStart, periodEnd, currencySymbol, carriedAmount } = props;
    const { t } = useLingui();

    const excludedCategoryIds = categoryIds.join(',');

    const handlePress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: {
                mode: AnalyticsTransactionsModeEnum.BUDGET_OTHER,
                type: TransactionTypeEnum.EXPENSE,
                excludedCategoryIds,
                startDate: periodStart.toISOString(),
                endDate: periodEnd.toISOString()
            }
        });
    };

    return (
        <BudgetDetailsLimitCard
            spent={spent}
            limitAmount={limitAmount}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.DetailsOtherCategoryRow}
            spentTestID={BudgetSelector.DetailsOtherCategorySpentLabel}
            onPress={handlePress}
        >
            <BudgetDetailsLimitHeading
                title={t`Other`}
                icon={UserIconNameEnum.CircleEllipsis}
                carriedAmount={carriedAmount}
                currencySymbol={currencySymbol}
            />
        </BudgetDetailsLimitCard>
    );
};
