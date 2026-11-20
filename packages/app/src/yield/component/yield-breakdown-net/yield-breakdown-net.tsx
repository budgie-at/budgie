import { useLingui } from '@lingui/react/macro';

import { useFormatYieldFigureAmount } from '../../hook/use-format-yield-figure-amount.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

interface Props {
    readonly net: number;
}

export const YieldBreakdownNet = ({ net }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatYieldFigureAmount();

    return <YieldBreakdownRow title={t`Net after tax`} value={formatAmount(net)} testID={PassiveIncomeSelector.NetAfterTax} />;
};
