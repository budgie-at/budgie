import { useLingui } from '@lingui/react/macro';

import { useFormatYieldRate } from '../../hook/use-format-yield-rate.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

interface Props {
    readonly rate: number;
    readonly isEstimated: boolean;
}

export const YieldBreakdownYieldRate = ({ rate, isEstimated }: Props) => {
    const { t } = useLingui();
    const formatRate = useFormatYieldRate();

    const formattedRate = formatRate(rate);
    const value = isEstimated ? t`≈ ${formattedRate}` : formattedRate;

    return <YieldBreakdownRow title={t`Yield · last 12 months`} value={value} testID={PassiveIncomeSelector.YieldRate} />;
};
