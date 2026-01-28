import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { CategorySelectorModalContext, CategorySelectorModalParams } from '../context/category-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const CategorySelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<CategorySelectorModalParams, number | null>('/category-selector');

    const value = { openCategorySelector: open, resolveCategorySelector: resolve, currentParams };

    return <CategorySelectorModalContext value={value}>{children}</CategorySelectorModalContext>;
};
