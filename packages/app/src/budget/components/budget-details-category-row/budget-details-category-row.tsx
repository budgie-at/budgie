import { BudgetAlertScopeEnum } from '@budgie/budget';
import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetDetailsLimitRow } from '../budget-details-limit-row/budget-details-limit-row';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly categoryId: number;
    readonly scope: BudgetProjectionScopeInterface;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
    readonly carriedAmount: number;
    readonly staggerIndex: number;
}

export const BudgetDetailsCategoryRow = (props: Props) => {
    const { categoryId, scope, periodStart, periodEnd, currencySymbol, carriedAmount, staggerIndex } = props;
    const { category } = useGetCategoryByIdQuery(categoryId);
    const title = isDefined(category) ? category.title : '';
    const icon = isDefined(category) ? category.icon : UserIconNameEnum.Shapes;
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
            icon={icon}
            onPress={handlePress}
            highlightTarget={highlightTarget}
            staggerIndex={staggerIndex}
        />
    );
};
