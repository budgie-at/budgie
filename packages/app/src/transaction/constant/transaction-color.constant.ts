import { TransactionTypeEnum } from '@budgie/contracts';

import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

export const TRANSACTION_COLOR: Record<TransactionTypeEnum, ColorPaletteVariant> = {
    [TransactionTypeEnum.INCOME]: 'positive',
    [TransactionTypeEnum.EXPENSE]: 'destructive',
    [TransactionTypeEnum.TRANSFER]: 'default',
    [TransactionTypeEnum.DEBT]: 'warning',
    [TransactionTypeEnum.ADJUSTMENT]: 'positive'
};
