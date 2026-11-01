import { UserIconNameEnum } from '@budgie/contracts';

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
    const title = isDefined(category) ? category.title : '';
    const icon = isDefined(category) ? category.icon : UserIconNameEnum.Shapes;

    return <BudgetPaceHintLine icon={icon} title={title} scope={scope} currencySymbol={currencySymbol} onPress={onPress} />;
};
