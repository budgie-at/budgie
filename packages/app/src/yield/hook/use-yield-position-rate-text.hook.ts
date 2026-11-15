import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { YIELD_UNAVAILABLE_LABEL } from '../constant/yield-unavailable-label.constant';

import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldAnnualYieldInterface } from '@budgie/market';

export const useYieldPositionRateText = ({ rate, reason, isEstimated }: YieldAnnualYieldInterface): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();

    if (!isDefined(rate)) {
        return isDefined(reason) ? t(YIELD_UNAVAILABLE_LABEL[reason]) : '—';
    }

    const formattedRate = formatRate(rate);
    const approximate = isEstimated ? '≈ ' : '';

    return t`${approximate}${formattedRate} a year`;
};
