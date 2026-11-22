import { YieldUnavailableReasonEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldAnnualYieldInterface } from '@budgie/market';
import type { MessageDescriptor } from '@lingui/core';

const YIELD_INLINE_UNAVAILABLE_LABEL: Readonly<Record<YieldUnavailableReasonEnum, MessageDescriptor>> = {
    [YieldUnavailableReasonEnum.UNDER_FOUR_WEEKS]: msg`available after 4 weeks`,
    [YieldUnavailableReasonEnum.AWAITING_SECOND_PAYOUT]: msg`available after the second payout`,
    [YieldUnavailableReasonEnum.NO_AVERAGE]: msg`no balance to measure`,
    [YieldUnavailableReasonEnum.NOT_ENOUGH_PRICES]: msg`not enough price history`,
    [YieldUnavailableReasonEnum.UNUSUALLY_HIGH]: msg`unusually high · balance history may be incomplete`
};

export const useYieldPositionRateText = ({ rate, reason, isEstimated }: YieldAnnualYieldInterface, isClosed: boolean): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();

    if (isClosed && !isDefined(rate)) {
        return t`closed`;
    }

    if (!isDefined(rate)) {
        return isDefined(reason) ? t(YIELD_INLINE_UNAVAILABLE_LABEL[reason]) : t`not in yield`;
    }

    const formattedRate = formatRate(rate);
    const approximate = isEstimated ? '≈ ' : '';

    return isClosed ? t`was ${approximate}${formattedRate} a year` : t`${approximate}${formattedRate} a year`;
};
