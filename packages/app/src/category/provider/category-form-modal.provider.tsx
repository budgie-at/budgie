import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { CategoryFormResult } from '../components/category-form/category-form';
import { CategoryFormModalContext, CategoryFormModalParams } from '../context/category-form-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const CategoryFormModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<CategoryFormModalParams, CategoryFormResult | null>('/category-form');

    const value = { openCategoryForm: open, resolveCategoryForm: resolve, currentParams };

    return <CategoryFormModalContext value={value}>{children}</CategoryFormModalContext>;
};
