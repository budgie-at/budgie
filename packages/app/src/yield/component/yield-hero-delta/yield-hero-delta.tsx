import { use } from 'react';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldDeltaLabel } from '../../hook/use-yield-delta-label.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;

export const YieldHeroDelta = ({ summary }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const { label, tone } = useYieldDeltaLabel(summary, screenKey.key.range);

    return (
        <YieldDeltaPill
            label={label}
            tone={tone}
            testID={PassiveIncomeSelector.Delta}
            maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER}
        />
    );
};
