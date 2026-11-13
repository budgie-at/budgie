import { YieldDeltaKindEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { YIELD_RANGE_LABEL } from '../../constant/yield-range-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldHeroTrendEnum } from '../../enum/yield-hero-trend.enum';
import { useYieldHeroTrend } from '../../hook/use-yield-hero-trend.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;

export const YieldHeroDelta = ({ summary }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { trend, change } = useYieldHeroTrend(summary);

    const sign = trend === YieldHeroTrendEnum.DOWN ? '−' : '+';
    const rangeShort = t(YIELD_RANGE_LABEL[screenKey.key.range]);
    const label = summary.delta?.kind === YieldDeltaKindEnum.NEW ? t`New this period` : t`${sign}${change} vs prior ${rangeShort}`;

    return <MetaPill label={label} testID={PassiveIncomeSelector.Delta} maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER} />;
};
