import { YieldKindEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const YIELD_KIND_DESCRIPTION: Readonly<Record<YieldKindEnum, MessageDescriptor>> = {
    [YieldKindEnum.STAKING]: msg`Rewards for staking crypto · shown under Staking & Earn`,
    [YieldKindEnum.EARN]: msg`Exchange savings products · shown under Staking & Earn`,
    [YieldKindEnum.DISTRIBUTION]: msg`Fund payouts, counted as income, not yield`,
    [YieldKindEnum.DIVIDEND]: msg`Paid by stocks or ETFs`,
    [YieldKindEnum.INTEREST]: msg`From savings and deposits`,
    [YieldKindEnum.TAX]: msg`Tax withheld from a payout`,
    [YieldKindEnum.NONE]: msg`Not counted as passive income`
};
