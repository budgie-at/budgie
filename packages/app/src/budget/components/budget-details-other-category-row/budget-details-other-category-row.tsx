import { BudgetAlertScopeEnum } from '@budgie/budget';
import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { BudgetDetailsLimitRow } from '../budget-details-limit-row/budget-details-limit-row';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly categoryIds: readonly number[];
    readonly scope: BudgetProjectionScopeInterface;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
    readonly carriedAmount: number;
    readonly staggerIndex: number;
}

const HIGHLIGHT_TARGET = { scope: BudgetAlertScopeEnum.OTHER };

export const BudgetDetailsOtherCategoryRow = (props: Props) => {
    const { categoryIds, scope, periodStart, periodEnd, currencySymbol, carriedAmount, staggerIndex } = props;
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
            icon={UserIconNameEnum.CircleEllipsis}
            onPress={handlePress}
            highlightTarget={HIGHLIGHT_TARGET}
            staggerIndex={staggerIndex}
        />
    );
};
