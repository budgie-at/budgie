import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import type { YieldBucketInterface, YieldGroupEnum } from '@budgie/market';

export const sumYieldScrubbedBuckets = (
    buckets: readonly YieldBucketInterface[],
    selectedIndex: number | null,
    mode: YieldChartModeEnum
) => {
    const index = selectedIndex ?? -1;
    const scrubbed = buckets.slice(mode === YieldChartModeEnum.RUNNING_TOTAL ? 0 : index, index + 1);

    return {
        total: scrubbed.reduce((sum, item) => sum + item.total, 0),
        isEstimated: scrubbed.some(item => item.isEstimated),
        amountOf: (group: YieldGroupEnum): number => scrubbed.reduce((sum, item) => sum + item.amounts[group], 0)
    };
};
