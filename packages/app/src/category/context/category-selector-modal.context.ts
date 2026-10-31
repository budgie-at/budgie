import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface CategorySelectorModalParams {
    readonly initialCategoryId?: number | null;
    readonly excludeCategoryIds?: number[];
    readonly variant?: ColorPaletteVariant;
    readonly title?: string;
    readonly description?: string;
    readonly commitLabel?: string;
    readonly getCommitLabel?: (destinationTitle: string) => string;
}

export type CategorySelectorResult = number | null;

export const [CategorySelectorModalContext, useCategorySelectorModal, useCategorySelectorModalParams] = createModalContext<
    CategorySelectorModalParams,
    CategorySelectorResult
>(null);
