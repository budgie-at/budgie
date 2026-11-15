import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import { useYieldDateLabels } from './use-yield-date-labels.hook';

import type { YieldScreenKeyInterface } from '../interface/yield-screen-key.interface';
import type { YieldScreenStateInterface } from '../interface/yield-screen-state.interface';

export const useYieldScreenState = (screenKey: YieldScreenKeyInterface): YieldScreenStateInterface => {
    const [mode, setModeState] = useState(YieldChartModeEnum.BARS);
    const [selection, setSelection] = useState<number | null>(null);
    const [touchedTarget, setTouchedTarget] = useState<string | null>(null);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);
    const { formatRangeCaption } = useYieldDateLabels();

    const { focusDay, period } = screenKey;
    const linkTarget = [focusDay, period?.fromDay, period?.toDay].join('|');
    const isTouched = touchedTarget === linkTarget;

    const selectIndex = (index: number | null) => {
        setTouchedTarget(linkTarget);
        setSelection(index);
    };
    const cancelScrub = () => {
        selectIndex(null);
    };
    const setMode = (nextMode: YieldChartModeEnum) => {
        cancelScrub();
        setModeState(nextMode);
    };

    const focusIndex = isDefined(focusDay)
        ? (summary?.buckets.findIndex(bucket => bucket.start <= focusDay && focusDay <= bucket.end) ?? -1)
        : -1;
    const untouchedIndex = focusIndex >= 0 ? focusIndex : null;

    const rangeCaption = isDefined(summary) ? formatRangeCaption(screenKey.key.range, summary.windowStart) : '';

    return {
        screen: { screenKey, mode, rangeCaption, isPeriodCaption: !isTouched && isDefined(period), setMode },
        selection: { selectedIndex: isTouched ? selection : untouchedIndex, selectIndex, cancelScrub }
    };
};
