import { InzhurGainRangeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { CurrencyMarketChart } from '../../../market-data/component/currency-market-chart/currency-market-chart';
import { useMarketChartTimeline } from '../../../market-data/hook/use-market-chart-timeline.hook';
import { useInzhurChartScrub } from '../../hook/use-inzhur-chart-scrub.hook';
import { useInzhurChartSummary } from '../../hook/use-inzhur-chart-summary.hook';

import type { InzhurRangedGainInterface, InzhurValuePointInterface } from '@budgie/sync';

interface Props {
    readonly points: readonly InzhurValuePointInterface[];
    readonly gains: readonly InzhurRangedGainInterface[];
    readonly subject: string;
    readonly testID: string;
}

const MIN_CHART_POINTS = 2;

export const InzhurPerformanceChart = ({ points, gains, subject, testID }: Props) => {
    const { t } = useLingui();
    const [range, setRange] = useState(InzhurGainRangeEnum.ALL);

    const rangeStart = gains.find(gain => gain.range === range)?.startDate ?? points.at(0)?.date ?? '';
    const rangePoints = points.filter(point => point.date >= rangeStart);
    const prices = rangePoints.map(point => ({ price: point.value, priceDate: point.date }));
    const { startLabel, endLabel } = useMarketChartTimeline(prices.at(0), prices.at(-1));
    const summary = useInzhurChartSummary(rangePoints, rangeStart, subject);
    const { scrubIndex, handleScrub } = useInzhurChartScrub(rangePoints);
    const rangeLabels = {
        [InzhurGainRangeEnum.MONTH]: t`1M`,
        [InzhurGainRangeEnum.THREE_MONTHS]: t`3M`,
        [InzhurGainRangeEnum.ALL]: t`All`
    };
    const segments = gains.map(gain => ({ value: gain.range, label: rangeLabels[gain.range], testID: `${testID}.Range.${gain.range}` }));

    const handleRangeChange = (nextRange: InzhurGainRangeEnum) => {
        handleScrub(null);
        setRange(nextRange);
    };

    if (prices.length < MIN_CHART_POINTS) {
        return null;
    }

    return (
        <View className="gap-y-xl self-stretch">
            <CurrencyMarketChart
                prices={prices}
                selectedIndex={scrubIndex}
                rangeLabel={summary}
                startLabel={startLabel}
                endLabel={endLabel}
                testID={testID}
                onScrub={handleScrub}
            />
            {segments.length > 1 ? <SegmentedControl segments={segments} value={range} onChange={handleRangeChange} /> : null}
        </View>
    );
};
