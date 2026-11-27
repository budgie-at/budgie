import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldSelectionContext } from '../context/yield-selection.context';
import { sumYieldScrubbedBuckets } from '../utils/sum-yield-scrubbed-buckets.util';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldIsEstimated = (summary: YieldSummaryInterface | null): boolean => {
    const { mode } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);

    if (!isDefined(summary)) {
        return false;
    }

    return isDefined(selectedIndex)
        ? sumYieldScrubbedBuckets(summary.buckets, selectedIndex, mode).isEstimated
        : summary.earned.isEstimated;
};
