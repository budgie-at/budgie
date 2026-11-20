import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { YIELD_UNAVAILABLE_LABEL } from '../constant/yield-unavailable-label.constant';

import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldAnnualYieldInterface } from '@budgie/market';

export const useYieldPositionRateText = ({ rate, reason, isEstimated }: YieldAnnualYieldInterface, isClosed: boolean): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();

    if (isClosed && !isDefined(rate)) {
        return t`Closed`;
    }

    if (!isDefined(rate)) {
        return isDefined(reason) ? t(YIELD_UNAVAILABLE_LABEL[reason]) : t`Excluded from yield`;
    }

    const formattedRate = formatRate(rate);
    const approximate = isEstimated ? '≈ ' : '';

    return isClosed ? t`Was ${approximate}${formattedRate} a year` : t`${approximate}${formattedRate} a year`;
};
