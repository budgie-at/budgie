import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';

import { CategorySelectorModalContext, CategorySelectorModalParams } from '../context/category-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const CategorySelectorModalProvider = ({ children }: Props) => {
    const [currentParams, setCurrentParams] = useState<CategorySelectorModalParams | null>(null);
    const resolverRef = useRef<((categoryId: number | null) => void) | null>(null);

    const openCategorySelector = (params?: CategorySelectorModalParams): Promise<number | null> =>
        new Promise(resolve => {
            setCurrentParams(params ?? {});
            resolverRef.current = resolve;
            router.push('/(modals)/category-selector');
        });

    const resolveCategorySelector = (categoryId: number | null) => {
        resolverRef.current?.(categoryId);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    const value = { openCategorySelector, resolveCategorySelector, currentParams };

    return <CategorySelectorModalContext value={value}>{children}</CategorySelectorModalContext>;
};
