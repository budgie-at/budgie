import { YieldBucketUnitEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';
import { Text, View } from 'react-native';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartModeControl } from '../yield-chart-mode-control/yield-chart-mode-control';
import { YieldChartPlot } from '../yield-chart-plot/yield-chart-plot';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const BUCKET_TITLE = {
    [YieldBucketUnitEnum.DAY]: msg`Per day`,
    [YieldBucketUnitEnum.WEEK]: msg`Per week`,
    [YieldBucketUnitEnum.MONTH]: msg`Per month`,
    [YieldBucketUnitEnum.QUARTER]: msg`Per quarter`,
    [YieldBucketUnitEnum.YEAR]: msg`Per year`
} as const;

export const YieldChartCard = () => {
    const { t } = useLingui();
    const { screenKey, mode } = use(YieldScreenContext);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const bucketTitle = t(BUCKET_TITLE[summary?.bucketUnit ?? YieldBucketUnitEnum.MONTH]);
    const title = mode === YieldChartModeEnum.BARS ? bucketTitle : t`Running total`;

    return (
        <View className="gap-y-[12px] rounded-3xl bg-surface-row p-[16px]" style={CONTINUOUS_CORNERS}>
            <View className="h-[32px] flex-row items-center justify-between">
                <Text className="text-md font-semibold text-primary" testID={PassiveIncomeSelector.ChartTitle}>
                    {title}
                </Text>
                <YieldChartModeControl />
            </View>

            <YieldChartPlot />
        </View>
    );
};
