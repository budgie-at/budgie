import { useLingui } from '@lingui/react/macro';

import { useFormatYieldFigureAmount } from '../../hook/use-format-yield-figure-amount.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

import type { YieldEstimatedFigureInterface } from '@budgie/market';

interface Props {
    readonly runRate: YieldEstimatedFigureInterface;
}

export const YieldBreakdownRunRate = ({ runRate }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatYieldFigureAmount();

    const amount = formatAmount(runRate.value);

    return (
        <YieldBreakdownRow
            title={t`Next 12 months`}
            subtitle={t`At today’s balances and rates`}
            value={t`≈ ${amount}`}
            testID={PassiveIncomeSelector.RunRate}
        />
    );
};
