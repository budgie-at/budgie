import { YieldRangeEnum } from '@budgie/market';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { YIELD_UNAVAILABLE_LABEL } from '../constant/yield-unavailable-label.constant';

import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldCombinedYieldInterface } from '@budgie/market';

export const useYieldRateText = (annualYield: YieldCombinedYieldInterface, range: YieldRangeEnum): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();

    const { rate, reason, isEstimated, holdingCount, totalCount, isPartialCoverage, excludesDistributions } = annualYield;

    if (!isDefined(rate)) {
        return isDefined(reason) ? t(YIELD_UNAVAILABLE_LABEL[reason]) : '';
    }

    const formattedRate = formatRate(rate);
    const rateLabel = isEstimated ? t`≈ ${formattedRate} a year` : t`${formattedRate} a year`;
    const twelveMonths = range === YieldRangeEnum.YEAR ? '' : t`(12 mo)`;
    const holdings = isPartialCoverage
        ? t({ message: plural(totalCount, { one: `on ${holdingCount} of # holding`, other: `on ${holdingCount} of # holdings` }) })
        : t({ message: plural(holdingCount, { one: 'across # holding', other: 'across # holdings' }) });
    const distributions = excludesDistributions ? t`excl. distributions` : '';

    return [[rateLabel, twelveMonths, holdings].filter(isNotEmptyString).join(' '), distributions].filter(isNotEmptyString).join(' · ');
};
