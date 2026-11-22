import { useIsIncreaseContrast } from '../../@generic/hook/use-is-increase-contrast.hook';
import { YIELD_GROUP_COLOR } from '../constant/yield-group-color.constant';

import type { YieldGroupEnum } from '@budgie/market';

export const useYieldGroupColor = (group: YieldGroupEnum) => {
    const isIncreaseContrast = useIsIncreaseContrast();

    const color = YIELD_GROUP_COLOR[group];

    return {
        background: isIncreaseContrast ? color.backgroundContrast : color.background,
        accent: isIncreaseContrast ? color.accentContrast : color.accent
    };
};
