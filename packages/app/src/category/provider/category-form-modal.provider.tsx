import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { CategoryFormModalContext } from '../context/category-form-modal.context';

import type { CategoryFormModalParams, CategoryFormModalResult } from '../context/category-form-modal.context';

export const CategoryFormModalProvider = createModalProvider<CategoryFormModalParams, CategoryFormModalResult>(
    CategoryFormModalContext,
    '/category-form'
);
