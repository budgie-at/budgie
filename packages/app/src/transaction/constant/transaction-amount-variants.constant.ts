import { cva } from 'class-variance-authority';

import { FOREGROUND_COLOR_PALETTE } from '../../@generic/constant/foreground-color-palette.constant';

export const transactionAmountVariants = cva('text-[17px] font-semibold tracking-tight text-right tabular-nums', {
    variants: { variant: { ...FOREGROUND_COLOR_PALETTE, positive: 'text-positive-strong' } }
});
