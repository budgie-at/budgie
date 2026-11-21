import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatYieldRate } from './use-format-yield-rate.hook';
import { useYieldFormatNet } from './use-yield-format-net.hook';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldRangeNetText = ({
    earned,
    tax,
    annualYield
}: Pick<YieldSummaryInterface, 'earned' | 'tax' | 'annualYield'>): string => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();
    const formatNet = useYieldFormatNet();

    const { net: rangeNet } = formatNet(earned.value, tax);
    const netText = isPositiveNumber(tax) ? t`${rangeNet} after tax` : t`No tax withheld`;
    const formattedRate = isDefined(annualYield.rate) ? formatRate(annualYield.rate) : '';

    return isDefined(annualYield.rate) ? t`${netText} · ${formattedRate} a year` : netText;
};
