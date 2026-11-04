import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../category/query/use-get-category-by-id.query';

export const useBudgetCategoryLimitAmountLabel = (categoryId: number) => {
    const { t } = useLingui();
    const { category } = useGetCategoryByIdQuery(categoryId);
    const categoryTitle = isDefined(category) ? category.title : t`Category`;

    return t`${categoryTitle} limit`;
};
