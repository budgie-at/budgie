import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface CategorySelectorModalParams {
    readonly initialCategoryId?: number | null;
    readonly excludeCategoryIds?: number[];
    readonly variant?: ColorPaletteVariant;
    readonly description?: string;
}

export type CategorySelectorResult = number | null;

export const [CategorySelectorModalContext, useCategorySelectorModal] = createModalContext<
    CategorySelectorModalParams,
    CategorySelectorResult
>(null);
