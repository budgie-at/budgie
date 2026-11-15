import { YieldGroupEnum } from '@budgie/market';

import type { YieldGroupColorInterface } from '../interface/yield-group-color.interface';

export const YIELD_GROUP_COLOR: Readonly<Record<YieldGroupEnum, YieldGroupColorInterface>> = {
    [YieldGroupEnum.STAKING_EARN]: {
        accent: 'accent-yield-staking',
        accentContrast: 'accent-yield-staking-contrast',
        background: 'bg-yield-staking',
        backgroundContrast: 'bg-yield-staking-contrast'
    },
    [YieldGroupEnum.INTEREST]: {
        accent: 'accent-yield-interest',
        accentContrast: 'accent-yield-interest-contrast',
        background: 'bg-yield-interest',
        backgroundContrast: 'bg-yield-interest-contrast'
    },
    [YieldGroupEnum.DIVIDENDS]: {
        accent: 'accent-yield-dividends',
        accentContrast: 'accent-yield-dividends-contrast',
        background: 'bg-yield-dividends',
        backgroundContrast: 'bg-yield-dividends-contrast'
    },
    [YieldGroupEnum.DISTRIBUTIONS]: {
        accent: 'accent-yield-distributions',
        accentContrast: 'accent-yield-distributions-contrast',
        background: 'bg-yield-distributions',
        backgroundContrast: 'bg-yield-distributions-contrast'
    },
    [YieldGroupEnum.TAX]: {
        accent: 'accent-yield-tax',
        accentContrast: 'accent-yield-tax-contrast',
        background: 'bg-yield-tax',
        backgroundContrast: 'bg-yield-tax-contrast'
    }
};
