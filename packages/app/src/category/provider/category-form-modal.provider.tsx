import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';

import { CategoryFormResult } from '../components/category-form/category-form';
import { CategoryFormModalContext, CategoryFormModalParams } from '../context/category-form-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const CategoryFormModalProvider = ({ children }: Props) => {
    const [currentParams, setCurrentParams] = useState<CategoryFormModalParams | null>(null);
    const resolverRef = useRef<((result: CategoryFormResult | null) => void) | null>(null);

    const openCategoryForm = (params?: CategoryFormModalParams): Promise<CategoryFormResult | null> =>
        new Promise(resolve => {
            setCurrentParams(params ?? {});
            resolverRef.current = resolve;
            router.push('/category-form');
        });

    const resolveCategoryForm = (result: CategoryFormResult | null) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    const value = { openCategoryForm, resolveCategoryForm, currentParams };

    return <CategoryFormModalContext value={value}>{children}</CategoryFormModalContext>;
};
