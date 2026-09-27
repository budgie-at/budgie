import { type PropsWithChildren } from 'react';

import { CategorySelectorCategoriesContext } from '../context/category-selector-categories.context';
import { useSearchCategoriesQuery } from '../query/use-search-categories.query';

export const CategorySelectorCategoriesProvider = ({ children }: PropsWithChildren) => {
    const { categories } = useSearchCategoriesQuery('', true);

    return <CategorySelectorCategoriesContext value={categories}>{children}</CategorySelectorCategoriesContext>;
};
