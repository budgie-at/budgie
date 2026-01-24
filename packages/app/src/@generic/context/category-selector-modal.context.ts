import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';

export interface CategorySelectorModalParams {
    readonly initialCategoryId?: number | null;
    readonly excludeCategoryIds?: number[];
    readonly variant?: ColorPaletteVariant;
    readonly description?: string;
}

interface CategorySelectorModalContextInterface {
    openCategorySelector: (params?: CategorySelectorModalParams) => Promise<number | null>;
    resolveCategorySelector: (categoryId: number | null) => void;
    currentParams: CategorySelectorModalParams | null;
}

export const CategorySelectorModalContext = createContext<CategorySelectorModalContextInterface>({
    openCategorySelector: () => Promise.resolve(null),
    resolveCategorySelector: emptyFn,
    currentParams: null
});

export const useCategorySelectorModal = () => use(CategorySelectorModalContext);
