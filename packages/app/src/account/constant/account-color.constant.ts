import { AccountTypeEnum } from '@budgie/contracts';

import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

export const ACCOUNT_COLOR: Record<AccountTypeEnum, ColorPaletteVariant> = {
    [AccountTypeEnum.BANK]: 'default',
    [AccountTypeEnum.CASH]: 'positive',
    [AccountTypeEnum.CRYPTO]: 'warning',
    [AccountTypeEnum.STOCKS]: 'pink',
    [AccountTypeEnum.DEBT]: 'warning',
    [AccountTypeEnum.SAVINGS]: 'positive',
    [AccountTypeEnum.BANK_SYNC]: 'default'
};
