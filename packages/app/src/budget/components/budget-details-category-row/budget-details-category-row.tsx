import { BudgetAlertScopeEnum } from '@budgie/budget';
import { TransactionTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsLimitRow } from '../budget-details-limit-row/budget-details-limit-row';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly categoryId: number;
    readonly title: string;
    readonly scope: BudgetProjectionScopeInterface;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
    readonly carriedAmount: number;
    readonly staggerIndex: number;
}

export const BudgetDetailsCategoryRow = (props: Props) => {
    const { categoryId, title, scope, periodStart, periodEnd, currencySymbol, carriedAmount, staggerIndex } = props;
    const testIDs = { row: BudgetSelector.DetailsCategoryRow(categoryId), spent: BudgetSelector.DetailsCategorySpentLabel(categoryId) };
    const highlightTarget = { scope: BudgetAlertScopeEnum.CATEGORY, categoryId };

    const handlePress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: {
                type: TransactionTypeEnum.EXPENSE,
                categoryId: String(categoryId),
                startDate: periodStart.toISOString(),
                endDate: periodEnd.toISOString()
            }
        });
    };

    return (
        <BudgetDetailsLimitRow
            title={title}
            carriedAmount={carriedAmount}
            scope={scope}
            currencySymbol={currencySymbol}
            testIDs={testIDs}
            onPress={handlePress}
            highlightTarget={highlightTarget}
            staggerIndex={staggerIndex}
        />
    );
};
