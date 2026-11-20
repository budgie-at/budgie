import { useLingui } from '@lingui/react/macro';

import { useFormatYieldFigureAmount } from '../../hook/use-format-yield-figure-amount.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

interface Props {
    readonly earned: number;
    readonly isEstimated: boolean;
}

export const YieldBreakdownEarned = ({ earned, isEstimated }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatYieldFigureAmount();

    const amount = formatAmount(earned);
    const value = isEstimated ? t`≈ ${amount}` : amount;

    return <YieldBreakdownRow title={t`Earned`} subtitle={t`Before tax`} value={value} testID={PassiveIncomeSelector.BreakdownEarned} />;
};
