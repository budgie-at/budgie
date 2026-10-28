import type { ColorPaletteVariant } from '../type/color-palette-variant.type';

export interface HairlineStatInterface {
    readonly label: string;
    readonly value: string;
    readonly variant: ColorPaletteVariant;
    readonly testID?: string;
}
