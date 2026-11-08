import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

export interface TransactionCategoryStepsConfigInterface {
    readonly variant: ColorPaletteVariant;
    readonly initialCategoryId: number | null;
    readonly excludeCategoryIds?: number[];
    readonly onSelect: (categoryId: number) => void;
    readonly onBack: () => void;
    readonly onShowCategory: () => void;
    readonly onShowCreate: () => void;
}
