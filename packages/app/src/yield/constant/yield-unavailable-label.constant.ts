import { YieldUnavailableReasonEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const YIELD_UNAVAILABLE_LABEL: Readonly<Record<YieldUnavailableReasonEnum, MessageDescriptor>> = {
    [YieldUnavailableReasonEnum.UNDER_FOUR_WEEKS]: msg`Available after 4 weeks`,
    [YieldUnavailableReasonEnum.AWAITING_SECOND_PAYOUT]: msg`Available after the second payout`,
    [YieldUnavailableReasonEnum.NO_AVERAGE]: msg`No balance to measure`,
    [YieldUnavailableReasonEnum.NOT_ENOUGH_PRICES]: msg`Not enough price history`,
    [YieldUnavailableReasonEnum.UNUSUALLY_HIGH]: msg`Unusually high · balance history may be incomplete`
};
