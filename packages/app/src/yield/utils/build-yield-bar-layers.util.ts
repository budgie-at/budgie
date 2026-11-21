import { YieldGroupEnum } from '@budgie/market';

import { YIELD_GROUP_COLOR } from '../constant/yield-group-color.constant';
import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';

import type { YieldBarLayerInterface } from '../interface/yield-bar-layer.interface';
import type { YieldBarLayoutInterface } from '../interface/yield-bar-layout.interface';

const TAX_FILL_CLASSNAME = 'accent-secondary-foreground';
const TAX_FILL_OPACITY = 0.7;

export const buildYieldBarLayers = (
    layout: YieldBarLayoutInterface,
    pathSize: number,
    isIncreaseContrast: boolean
): readonly YieldBarLayerInterface[] => {
    const fillOf = (group: YieldGroupEnum) =>
        isIncreaseContrast ? YIELD_GROUP_COLOR[group].accentContrast : YIELD_GROUP_COLOR[group].accent;
    const stackSize = YIELD_STACK_GROUPS.length;
    const stacked = YIELD_STACK_GROUPS.map((group, index): YieldBarLayerInterface => ({
        group,
        offset: index * pathSize,
        rects: layout.groups[group],
        fillClassName: fillOf(group),
        fillOpacity: 1,
        opacityScale: 1
    }));
    const tax: YieldBarLayerInterface = {
        group: YieldGroupEnum.TAX,
        offset: stackSize * pathSize,
        rects: layout.tax,
        fillClassName: TAX_FILL_CLASSNAME,
        fillOpacity: TAX_FILL_OPACITY,
        opacityScale: 1
    };

    return [...stacked, tax];
};
