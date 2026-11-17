import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import type { YieldBucketInterface } from '@budgie/market';

export const selectYieldScrubbedBuckets = (
    buckets: readonly YieldBucketInterface[],
    selectedIndex: number | null,
    mode: YieldChartModeEnum
): readonly YieldBucketInterface[] => {
    const index = selectedIndex ?? -1;

    return buckets.slice(mode === YieldChartModeEnum.RUNNING_TOTAL ? 0 : index, index + 1);
};
