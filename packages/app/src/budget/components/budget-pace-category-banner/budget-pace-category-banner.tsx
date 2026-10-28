import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetPaceBannerCard } from '../budget-pace-banner-card/budget-pace-banner-card';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly categoryId: number;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly onPress: () => void;
}

export const BudgetPaceCategoryBanner = ({ categoryId, scope, currencySymbol, onPress }: Props) => {
    const { category } = useGetCategoryByIdQuery(categoryId);
    const title = isDefined(category) ? category.title : '';

    return <BudgetPaceBannerCard title={title} scope={scope} currencySymbol={currencySymbol} onPress={onPress} />;
};
