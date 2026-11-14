import { YieldGroupEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const YIELD_GROUP_LABEL: Readonly<Record<YieldGroupEnum, MessageDescriptor>> = {
    [YieldGroupEnum.STAKING_EARN]: msg`Staking & Earn`,
    [YieldGroupEnum.INTEREST]: msg`Interest`,
    [YieldGroupEnum.DIVIDENDS]: msg`Dividends`,
    [YieldGroupEnum.DISTRIBUTIONS]: msg`Distributions`,
    [YieldGroupEnum.TAX]: msg`Tax withheld`
};
