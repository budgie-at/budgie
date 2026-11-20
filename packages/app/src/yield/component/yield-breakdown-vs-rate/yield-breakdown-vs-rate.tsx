import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatYieldRate } from '../../hook/use-format-yield-rate.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

import type { YieldVsRateInterface } from '@budgie/market';

interface Props {
    readonly vsRate: YieldVsRateInterface;
}

export const YieldBreakdownVsRate = ({ vsRate }: Props) => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();

    const actual = isDefined(vsRate.actual) ? formatRate(vsRate.actual) : '—';
    const expected = formatRate(vsRate.expected);

    return <YieldBreakdownRow title={t`Yield vs expected`} value={t`${actual} vs ${expected}`} testID={PassiveIncomeSelector.VsRate} />;
};
