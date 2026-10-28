import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetPaceHintLine } from '../budget-pace-hint-line/budget-pace-hint-line';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly categoryId: number;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly onPress: () => void;
}

export const BudgetPaceHintCategory = ({ categoryId, scope, currencySymbol, onPress }: Props) => {
    const { category } = useGetCategoryByIdQuery(categoryId);

    return (
        <BudgetPaceHintLine
            title={isDefined(category) ? category.title : ''}
            scope={scope}
            currencySymbol={currencySymbol}
            onPress={onPress}
        />
    );
};
