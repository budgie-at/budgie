import { YieldGroupEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { useFormatYieldFigureAmount } from '../../hook/use-format-yield-figure-amount.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';

import type { YieldEstimatedFigureInterface } from '@budgie/market';

interface Props {
    readonly runRate: YieldEstimatedFigureInterface;
}

export const YieldBreakdownRunRate = ({ runRate }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatYieldFigureAmount();
    const summary = useYieldSummary();
    const { screenKey } = use(YieldScreenContext);

    const amount = formatAmount(runRate.value);
    const hasDistributions =
        !isDefined(screenKey.key.group) &&
        summary?.groups.some(({ group, total }) => group === YieldGroupEnum.DISTRIBUTIONS && total > 0) === true;
    const subtitle = hasDistributions ? t`At today’s balances and rates, excluding distributions` : t`At today’s balances and rates`;

    return (
        <YieldBreakdownRow title={t`Next 12 months`} subtitle={subtitle} value={t`≈ ${amount}`} testID={PassiveIncomeSelector.RunRate} />
    );
};
