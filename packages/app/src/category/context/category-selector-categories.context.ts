import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { CategorySelectorCategoriesInterface } from '../interface/category-selector-categories.interface';

export const CategorySelectorCategoriesContext = createContext<CategorySelectorCategoriesInterface>({
    categories: null,
    markSelectorOpened: emptyFn
});
