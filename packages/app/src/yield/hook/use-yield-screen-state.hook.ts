import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import type { YieldScreenKeyInterface } from '../interface/yield-screen-key.interface';
import type { YieldScreenStateInterface } from '../interface/yield-screen-state.interface';

export const useYieldScreenState = (screenKey: YieldScreenKeyInterface): YieldScreenStateInterface => {
    const [mode, setModeState] = useState(YieldChartModeEnum.BARS);
    const [selection, setSelection] = useState<number | null>(null);
    const [isTouched, setIsTouched] = useState(false);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const selectIndex = (index: number | null) => {
        setIsTouched(true);
        setSelection(index);
    };
    const cancelScrub = () => {
        selectIndex(null);
    };
    const setMode = (nextMode: YieldChartModeEnum) => {
        cancelScrub();
        setModeState(nextMode);
    };

    const { focusDay } = screenKey;
    const focusIndex = isDefined(focusDay)
        ? (summary?.buckets.findIndex(bucket => bucket.start <= focusDay && focusDay <= bucket.end) ?? -1)
        : -1;
    const untouchedIndex = focusIndex >= 0 ? focusIndex : null;

    return {
        screen: { screenKey, mode, isPeriodCaption: !isTouched && isDefined(screenKey.period), setMode },
        selection: { selectedIndex: isTouched ? selection : untouchedIndex, selectIndex, cancelScrub }
    };
};
