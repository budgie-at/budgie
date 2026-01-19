import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useThemeContext } from '../../../theme/context/theme.context';
import { dark, light } from '../../../theme/provider/theme.provider';
import { BudgetTrendDataPointInterface } from '../../interface/budget-trend-data-point.interface';

interface Props {
    readonly dataPoints: BudgetTrendDataPointInterface[];
}

type ChartDataPoint = {
    [key: string]: unknown;
    index: number;
    spent: number;
    limit: number;
    label: string;
};

const Y_KEYS: ('spent' | 'limit')[] = ['spent', 'limit'];
const Y_DOMAIN_MULTIPLIER = 1.1;
const MAX_X_TICKS = 6;
const Y_TICK_COUNT = 4;

const convertToChartData = (dataPoints: BudgetTrendDataPointInterface[]): ChartDataPoint[] =>
    dataPoints.map((point, index) => ({
        index,
        spent: point.spent,
        limit: point.limit,
        label: point.periodLabel
    }));

const calculateMaxValue = (dataPoints: BudgetTrendDataPointInterface[]): number =>
    Math.max(...dataPoints.map(point => Math.max(point.spent, point.limit)));

interface AxisOptionsParams {
    readonly colors: typeof light;
    readonly chartData: ChartDataPoint[];
    readonly dataPointsLength: number;
    readonly formatLabel: (value: number) => string;
}

const buildAxisOptions = ({ colors, chartData, dataPointsLength, formatLabel }: AxisOptionsParams) => ({
    lineColor: colors['--color-secondary-corner'],
    labelColor: colors['--color-secondary-foreground'],
    tickCount: { x: Math.min(dataPointsLength, MAX_X_TICKS), y: Y_TICK_COUNT },
    formatXLabel: (value: unknown) => chartData[Math.round(value as number)]?.label ?? '',
    formatYLabel: (value: unknown) => formatLabel(value as number)
});

export const BudgetSpendingTrendChart = ({ dataPoints }: Props) => {
    const { isDarkColorSchema } = useThemeContext();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);

    if (!isNotEmptyArray(dataPoints)) {
        return (
            <Card>
                <Text className="text-primary font-medium mb-md">
                    <Trans>Spending Trend</Trans>
                </Text>
                <Text className="text-secondary-foreground">
                    <Trans>No spending data available</Trans>
                </Text>
            </Card>
        );
    }

    const colors = isDarkColorSchema ? dark : light;
    const chartData = convertToChartData(dataPoints);
    const maxValue = calculateMaxValue(dataPoints);
    const yDomain: [number, number] = [0, maxValue * Y_DOMAIN_MULTIPLIER];
    const domain = { y: yDomain };
    const formatLabel = (value: number) => formatMoney(value, defaultInstrument.symbol);
    const axisOptions = buildAxisOptions({ colors, chartData, dataPointsLength: dataPoints.length, formatLabel });

    return (
        <Card>
            <Text className="text-primary font-medium mb-md">
                <Trans>Spending Trend</Trans>
            </Text>
            <View className="h-48">
                <CartesianChart data={chartData} xKey="index" yKeys={Y_KEYS} domain={domain} axisOptions={axisOptions}>
                    {({ points }) => (
                        <>
                            <Line
                                points={points.limit}
                                color={colors['--color-secondary-foreground']}
                                strokeWidth={1}
                                curveType="natural"
                            />
                            <Line points={points.spent} color={colors['--color-default-foreground']} strokeWidth={2} curveType="natural" />
                        </>
                    )}
                </CartesianChart>
            </View>
            <View className="flex-row justify-center gap-x-5xl mt-md">
                <View className="flex-row items-center gap-x-xs">
                    <View className="w-3 h-3 rounded-full bg-default-foreground" />
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Spent</Trans>
                    </Text>
                </View>
                <View className="flex-row items-center gap-x-xs">
                    <View className="w-3 h-3 rounded-full bg-secondary-foreground" />
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Limit</Trans>
                    </Text>
                </View>
            </View>
        </Card>
    );
};
