import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

const ZERO_AMOUNT_EPSILON = 1;

export const getRunwayAmountVariant = (amount: number): ColorPaletteVariant => {
    if (amount > ZERO_AMOUNT_EPSILON) {
        return 'positive';
    }

    if (amount < -ZERO_AMOUNT_EPSILON) {
        return 'destructive';
    }

    return 'warning';
};
