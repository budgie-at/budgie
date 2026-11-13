import { YieldGroupEnum } from '@budgie/market';

import { YIELD_GROUP_COLOR } from '../constant/yield-group-color.constant';
import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';

import type { YieldBarLayerInterface } from '../interface/yield-bar-layer.interface';
import type { YieldBarLayersInterface } from '../interface/yield-bar-layers.interface';
import type { YieldBarLayoutInterface } from '../interface/yield-bar-layout.interface';

export const buildYieldBarLayers = (
    layout: YieldBarLayoutInterface,
    pathSize: number,
    isIncreaseContrast: boolean
): YieldBarLayersInterface => {
    const fillOf = (group: YieldGroupEnum) =>
        isIncreaseContrast ? YIELD_GROUP_COLOR[group].accentContrast : YIELD_GROUP_COLOR[group].accent;
    const stackSize = YIELD_STACK_GROUPS.length;
    const stacked = (rectsOf: (group: YieldGroupEnum) => YieldBarLayerInterface['rects'], firstSlot: number) =>
        YIELD_STACK_GROUPS.map((group, index): YieldBarLayerInterface => ({
            group,
            offset: (firstSlot + index) * pathSize,
            rects: rectsOf(group),
            fillClassName: fillOf(group)
        }));
    const tax: YieldBarLayerInterface = {
        group: YieldGroupEnum.TAX,
        offset: stackSize * 2 * pathSize,
        rects: layout.tax,
        fillClassName: fillOf(YieldGroupEnum.TAX)
    };

    return {
        solid: [...stacked(group => layout.groups[group], 0), tax],
        estimated: stacked(group => layout.estimated[group], stackSize)
    };
};
