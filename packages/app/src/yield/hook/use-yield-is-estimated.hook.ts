import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldSelectionContext } from '../context/yield-selection.context';
import { selectYieldScrubbedBuckets } from '../utils/select-yield-scrubbed-buckets.util';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldIsEstimated = (summary: YieldSummaryInterface | null): boolean => {
    const { mode } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);

    if (!isDefined(summary)) {
        return false;
    }

    return isDefined(selectedIndex)
        ? selectYieldScrubbedBuckets(summary.buckets, selectedIndex, mode).some(bucket => bucket.isEstimated)
        : summary.earned.isEstimated;
};
