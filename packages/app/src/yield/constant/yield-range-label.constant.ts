import { YieldRangeEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const YIELD_RANGE_LABEL: Readonly<Record<YieldRangeEnum, MessageDescriptor>> = {
    [YieldRangeEnum.MONTH]: msg`1M`,
    [YieldRangeEnum.QUARTER]: msg`3M`,
    [YieldRangeEnum.YEAR]: msg`1Y`,
    [YieldRangeEnum.ALL]: msg`All`
};
