import { useLingui } from '@lingui/react/macro';

import { useFormatYieldFigureAmount } from '../../hook/use-format-yield-figure-amount.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

interface Props {
    readonly average: number;
}

export const YieldBreakdownMonthlyAverage = ({ average }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatYieldFigureAmount();

    const amount = formatAmount(average);

    return <YieldBreakdownRow title={t`Monthly average`} value={amount} testID={PassiveIncomeSelector.MonthlyAverage} />;
};
