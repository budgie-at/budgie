import { YIELD_GROUP_COLOR } from '../constant/yield-group-color.constant';

import type { YieldGroupEnum } from '@budgie/market';

export const getYieldGroupAccent = (group: YieldGroupEnum, isIncreaseContrast: boolean) =>
    isIncreaseContrast ? YIELD_GROUP_COLOR[group].accentContrast : YIELD_GROUP_COLOR[group].accent;
