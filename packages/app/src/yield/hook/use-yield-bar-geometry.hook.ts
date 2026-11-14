import { useAtomSet, useAtomValue } from '@effect/atom-react/Hooks';
import { useEffect, useEffectEvent } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from '../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../@generic/hook/use-reduced-motion.hook';
import { yieldChartAnimatedAtom } from '../constant/yield-chart-animated-atom.constant';
import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';

import type { YieldBarLayoutInterface } from '../interface/yield-bar-layout.interface';

const GROW_DURATION = 300;
const MORPH_DURATION = 220;

const listRects = (layout: YieldBarLayoutInterface) => [
    ...YIELD_STACK_GROUPS.flatMap(group => layout.groups[group]),
    ...YIELD_STACK_GROUPS.flatMap(group => layout.estimated[group]),
    ...layout.tax
];

export const useYieldBarGeometry = (layout: YieldBarLayoutInterface) => {
    const reducedMotion = useReducedMotion();
    const hasAnimated = useAtomValue(yieldChartAnimatedAtom);
    const setHasAnimated = useAtomSet(yieldChartAnimatedAtom);

    const isFirstGrow = !hasAnimated && !reducedMotion;
    const duration = isFirstGrow ? GROW_DURATION : MORPH_DURATION;
    const appliedDuration = reducedMotion ? 0 : duration;
    const target = listRects(layout).flatMap(rect => [rect.y, rect.height]);
    const baseline = listRects(layout).flatMap(() => [layout.zeroY, 0]);
    const values = useSharedValue(isFirstGrow ? baseline : target);
    const signature = target.join(',');

    const applyLayout = useEffectEvent(() => {
        values.set(appliedDuration > 0 ? withTiming(target, { duration: appliedDuration, easing: EASE_OUT }) : target);
    });

    useEffect(() => void applyLayout(), [signature]);
    useEffect(() => void setHasAnimated(true), [setHasAnimated]);

    return values;
};
