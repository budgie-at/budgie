import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

export interface OnboardingReceiptRowInterface {
    readonly label: string;
    readonly value: string;
    readonly valueVariant?: ColorPaletteVariant;
}
