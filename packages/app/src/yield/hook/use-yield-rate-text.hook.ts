import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { YIELD_UNAVAILABLE_LABEL } from '../constant/yield-unavailable-label.constant';

import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldCombinedYieldInterface } from '@budgie/market';

export const useYieldRateText = ({ rate, reason, isEstimated }: YieldCombinedYieldInterface): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();

    if (!isDefined(rate)) {
        return isDefined(reason) ? t(YIELD_UNAVAILABLE_LABEL[reason]) : '';
    }

    const formattedRate = formatRate(rate);

    return isEstimated ? t`≈ ${formattedRate} yield · last 12 months` : t`${formattedRate} yield · last 12 months`;
};
