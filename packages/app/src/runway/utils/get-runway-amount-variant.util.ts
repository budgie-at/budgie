import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

export const getRunwayAmountVariant = (amount: number, epsilon = 1): ColorPaletteVariant => {
    if (amount > epsilon) {
        return 'positive';
    }

    if (amount < -epsilon) {
        return 'destructive';
    }

    return 'warning';
};
