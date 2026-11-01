import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { DestinationCommitCopyInterface } from '../../@generic/interface/destination-commit-copy.interface';

export interface CategorySelectorModalParams {
    readonly initialCategoryId?: number | null;
    readonly excludeCategoryIds?: number[];
    readonly variant?: ColorPaletteVariant;
    readonly title?: string;
    readonly description?: string;
    readonly commitLabel?: string;
    readonly getCommitCopy?: (destinationTitle: string) => DestinationCommitCopyInterface;
}

export type CategorySelectorResult = number | null;

export const [CategorySelectorModalContext, useCategorySelectorModal, useCategorySelectorModalParams] = createModalContext<
    CategorySelectorModalParams,
    CategorySelectorResult
>(null);
