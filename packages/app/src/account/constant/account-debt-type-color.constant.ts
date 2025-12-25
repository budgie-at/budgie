import { AccountDebtTypeEnum } from '@budgie/contracts';
import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

export const ACCOUNT_DEBT_TYPE_COLOR: Record<AccountDebtTypeEnum, ColorPaletteVariant> = {
    [AccountDebtTypeEnum.LENT]: 'positive',
    [AccountDebtTypeEnum.BORROW]: 'warning'
};
