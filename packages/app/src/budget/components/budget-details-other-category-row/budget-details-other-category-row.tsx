import { BudgetAlertScopeEnum } from '@budgie/budget';
import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsLimitRow } from '../budget-details-limit-row/budget-details-limit-row';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly categoryIds: readonly number[];
    readonly scope: BudgetProjectionScopeInterface;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
    readonly carriedAmount: number;
}

export const BudgetDetailsOtherCategoryRow = (props: Props) => {
    const { categoryIds, scope, periodStart, periodEnd, currencySymbol, carriedAmount } = props;
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
        <BudgetDetailsLimitRow
            title={t`Other`}
            carriedAmount={carriedAmount}
            scope={scope}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.DetailsOtherCategoryRow}
            spentTestID={BudgetSelector.DetailsOtherCategorySpentLabel}
            onPress={handlePress}
            highlightTarget={{ scope: BudgetAlertScopeEnum.OTHER }}
        />
    );
};
