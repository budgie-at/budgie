import { AccountDebtTypeEnum } from '@budgie/contracts';

import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

export const DEBT_DIRECTION_COLOR: Record<AccountDebtTypeEnum, ColorPaletteVariant> = {
    [AccountDebtTypeEnum.BORROW]: 'destructive',
    [AccountDebtTypeEnum.LENT]: 'positive'
};
