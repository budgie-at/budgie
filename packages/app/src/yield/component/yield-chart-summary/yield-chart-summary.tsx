import { YieldRangeEnum } from '@budgie/market';
import { use } from 'react';
import { View } from 'react-native';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartSeeAllTime } from '../yield-chart-see-all-time/yield-chart-see-all-time';
import { YieldChartSummaryText } from '../yield-chart-summary-text/yield-chart-summary-text';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

export const YieldChartSummary = ({ summary }: Props) => {
    const { screenKey } = use(YieldScreenContext);

    const isSeeAllTimeVisible = summary.payoutCount === 0 && screenKey.key.range !== YieldRangeEnum.ALL;

    return (
        <View className="h-[220px] items-center justify-center gap-y-sm px-3xl" testID={PassiveIncomeSelector.PlotSummary}>
            <YieldChartSummaryText summary={summary} />
            {isSeeAllTimeVisible ? <YieldChartSeeAllTime /> : null}
        </View>
    );
};
