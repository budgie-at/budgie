import { CategoryEntityInterface } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { CategoryFormResult } from '../components/category-form/category-form';

export interface CategoryFormModalParams {
    readonly category?: CategoryEntityInterface;
    readonly defaultTitle?: string;
}

export type CategoryFormModalResult = CategoryFormResult | null;

export const [CategoryFormModalContext, useCategoryFormModal] = createModalContext<CategoryFormModalParams, CategoryFormModalResult>(null);
