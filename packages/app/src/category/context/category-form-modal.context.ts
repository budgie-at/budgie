import { CategoryEntityInterface } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { CategoryFormResult } from '../components/category-form/category-form';

export interface CategoryFormModalParams {
    readonly category?: CategoryEntityInterface;
    readonly defaultTitle?: string;
}

interface CategoryFormModalContextInterface {
    openCategoryForm: (params?: CategoryFormModalParams) => Promise<CategoryFormResult | null>;
    resolveCategoryForm: (result: CategoryFormResult | null) => void;
    currentParams: CategoryFormModalParams | null;
}

export const CategoryFormModalContext = createContext<CategoryFormModalContextInterface>({
    openCategoryForm: () => Promise.resolve(null),
    resolveCategoryForm: emptyFn,
    currentParams: null
});

export const useCategoryFormModal = () => use(CategoryFormModalContext);
