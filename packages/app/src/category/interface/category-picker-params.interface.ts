import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

export interface CategoryPickerParamsInterface {
    readonly variant: ColorPaletteVariant;
    readonly initialCategoryId: number | null;
    readonly excludeCategoryIds?: number[];
    readonly title?: string;
    readonly description?: string;
    readonly syncZone?: string;
}
