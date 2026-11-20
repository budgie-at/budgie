import { YieldKindEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const YIELD_KIND_DESCRIPTION: Readonly<Record<YieldKindEnum, MessageDescriptor>> = {
    [YieldKindEnum.STAKING]: msg`Crypto staking rewards`,
    [YieldKindEnum.EARN]: msg`Exchange savings products`,
    [YieldKindEnum.DISTRIBUTION]: msg`Fund payouts, not counted in yield`,
    [YieldKindEnum.DIVIDEND]: msg`Paid by stocks and ETFs`,
    [YieldKindEnum.INTEREST]: msg`Savings and deposits`,
    [YieldKindEnum.TAX]: msg`Tax withheld from a payout`,
    [YieldKindEnum.NONE]: msg`Excluded from all passive income totals`
};
