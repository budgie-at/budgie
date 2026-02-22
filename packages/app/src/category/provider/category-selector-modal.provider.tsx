import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { CategorySelectorModalContext } from '../context/category-selector-modal.context';

import type { CategorySelectorModalParams, CategorySelectorResult } from '../context/category-selector-modal.context';

export const CategorySelectorModalProvider = createModalProvider<CategorySelectorModalParams, CategorySelectorResult>(
    CategorySelectorModalContext,
    '/category-selector'
);
