import { YieldUnavailableReasonEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const YIELD_INLINE_UNAVAILABLE_LABEL: Readonly<Record<YieldUnavailableReasonEnum, MessageDescriptor>> = {
    [YieldUnavailableReasonEnum.UNDER_FOUR_WEEKS]: msg`available after 4 weeks`,
    [YieldUnavailableReasonEnum.AWAITING_SECOND_PAYOUT]: msg`available after the second payout`,
    [YieldUnavailableReasonEnum.NO_AVERAGE]: msg`no balance to measure`,
    [YieldUnavailableReasonEnum.NOT_ENOUGH_PRICES]: msg`not enough price history`,
    [YieldUnavailableReasonEnum.UNUSUALLY_HIGH]: msg`unusually high · balance history may be incomplete`
};
