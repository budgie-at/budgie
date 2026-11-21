import { use } from 'react';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldDeltaLabel } from '../../hook/use-yield-delta-label.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

export const YieldHeroDelta = ({ summary }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const { label, caption, tone } = useYieldDeltaLabel(summary, screenKey.key.range);

    return <YieldDeltaPill label={label} caption={caption} tone={tone} testID={PassiveIncomeSelector.Delta} />;
};
