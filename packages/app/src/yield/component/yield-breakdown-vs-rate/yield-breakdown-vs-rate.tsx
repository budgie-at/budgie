import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { StatCell } from '../../../@generic/component/stat-cell/stat-cell';
import { useFormatYieldRate } from '../../hook/use-format-yield-rate.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldVsRateInterface } from '@budgie/market';

interface Props {
    readonly vsRate: YieldVsRateInterface;
}

export const YieldBreakdownVsRate = ({ vsRate }: Props) => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();

    const actual = isDefined(vsRate.actual) ? formatRate(vsRate.actual) : '—';
    const expected = formatRate(vsRate.expected);

    return <StatCell label={t`vs rate`} value={t`${actual} vs ${expected}`} variant="default" testID={PassiveIncomeSelector.VsRate} />;
};
