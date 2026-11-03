import { CategoryEntityInterface } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { CategoryFormResult } from '../interface/category-form-result.interface';

export interface CategoryFormModalParams {
    readonly category?: CategoryEntityInterface;
    readonly defaultTitle?: string;
}

export type CategoryFormModalResult = CategoryFormResult | null;

export const [CategoryFormModalContext, useCategoryFormModal, useCategoryFormModalParams] = createModalContext<
    CategoryFormModalParams,
    CategoryFormModalResult
>(null);
