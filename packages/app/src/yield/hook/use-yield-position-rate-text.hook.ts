import { useLingui } from '@lingui/react/macro';
import { useWindowDimensions } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YIELD_INLINE_UNAVAILABLE_LABEL } from '../constant/yield-inline-unavailable-label.constant';
import { YIELD_NARROW_WINDOW_WIDTH } from '../constant/yield-narrow-window-width.constant';

import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldAnnualYieldInterface } from '@budgie/market';

export const useYieldPositionRateText = ({ rate, reason, isEstimated }: YieldAnnualYieldInterface, isClosed: boolean): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();
    const { width } = useWindowDimensions();

    if (isClosed && !isDefined(rate)) {
        return t`closed`;
    }

    if (!isDefined(rate)) {
        return isDefined(reason) ? t(YIELD_INLINE_UNAVAILABLE_LABEL[reason]) : t`not in yield`;
    }

    const formattedRate = formatRate(rate);
    const approximate = isEstimated ? '≈ ' : '';

    if (width <= YIELD_NARROW_WINDOW_WIDTH) {
        return isClosed ? t`was ${approximate}${formattedRate}/yr` : t`${approximate}${formattedRate}/yr`;
    }

    return isClosed ? t`was ${approximate}${formattedRate} a year` : t`${approximate}${formattedRate} a year`;
};
