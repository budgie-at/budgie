import { useAtomSet } from '@effect/atom-react/Hooks';
import { useEffect, useEffectEvent, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { inzhurChartScrubAtom } from '../constant/inzhur-chart-scrub-atom.constant';

import type { InzhurValuePointInterface } from '@budgie/sync';

export const useInzhurChartScrub = (points: readonly InzhurValuePointInterface[]) => {
    const [scrubIndex, setScrubIndex] = useState<number | null>(null);
    const setScrubbedPoint = useAtomSet(inzhurChartScrubAtom);
    const resetScrubbedPoint = useEffectEvent(() => void setScrubbedPoint(null));

    useEffect(() => () => void resetScrubbedPoint(), []);

    const handleScrub = (index: number | null) => {
        setScrubIndex(index);
        setScrubbedPoint(isDefined(index) ? (points.at(index) ?? null) : null);
    };

    return { scrubIndex, handleScrub };
};
