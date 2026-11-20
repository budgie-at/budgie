import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YIELD_UNAVAILABLE_LABEL } from '../constant/yield-unavailable-label.constant';
import { YieldScreenContext } from '../context/yield-screen.context';

import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldCombinedYieldInterface } from '@budgie/market';

export const useYieldRateText = ({ rate, reason, isEstimated }: YieldCombinedYieldInterface): string => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const formatRate = useFormatYieldRate();

    if (!isDefined(rate)) {
        return isDefined(reason) ? t(YIELD_UNAVAILABLE_LABEL[reason]) : '';
    }

    const formattedRate = formatRate(rate);

    const isYearRange = screenKey.key.range === YieldRangeEnum.YEAR;

    if (isYearRange) {
        return isEstimated ? t`≈ ${formattedRate} yield` : t`${formattedRate} yield`;
    }

    return isEstimated ? t`≈ ${formattedRate} yield over the last year` : t`${formattedRate} yield over the last year`;
};
