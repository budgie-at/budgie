import { YieldRangeEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const YIELD_RANGE_PERIOD_LABEL: Readonly<Record<YieldRangeEnum, MessageDescriptor>> = {
    [YieldRangeEnum.MONTH]: msg`Last 30 days`,
    [YieldRangeEnum.QUARTER]: msg`Last 3 months`,
    [YieldRangeEnum.YEAR]: msg`Last 12 months`,
    [YieldRangeEnum.ALL]: msg`All time`
};
