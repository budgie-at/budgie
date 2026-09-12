import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';
import { RUNWAY_FORECAST_HORIZONS_MONTHS, RUNWAY_HORIZON_MONTHS } from '../../constant/runway-forecast.constant';
import { buildRunwayForecastPath } from '../../utils/build-forecast-path.util';
import { RunwayForecastRunOutMarker } from '../runway-forecast-run-out-marker/runway-forecast-run-out-marker';
import { RunwayHorizonChip } from '../runway-horizon-chip/runway-horizon-chip';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 125;
const CHART_PADDING_LEFT = 40;
const CHART_PADDING_RIGHT = 6;
const CHART_PADDING_TOP = 6;
const CHART_PADDING_BOTTOM = 20;
const LABEL_FONT_SIZE = 8;
const LABEL_BOTTOM_OFFSET = 12;

export const RunwayForecastChart = ({ computation }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndYear } = useFormatDate();
    const formatDigits = useFormatDigits(0);

    const geometry = buildRunwayForecastPath({
        computation,
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        paddingLeft: CHART_PADDING_LEFT,
        paddingRight: CHART_PADDING_RIGHT,
        paddingTop: CHART_PADDING_TOP,
        paddingBottom: CHART_PADDING_BOTTOM
    });
    const tickLabels = RUNWAY_FORECAST_HORIZONS_MONTHS.map((months, index) => (index === 0 ? t`now` : formatDigits(months)));
    const runOutLabel = isDefined(computation.runsOutAt) ? formatMonthAndYear(computation.runsOutAt) : '';
    const { runOutX, runOutY } = geometry;
    const chartBottom = CHART_HEIGHT - CHART_PADDING_BOTTOM;
    const chartRight = CHART_WIDTH - CHART_PADDING_RIGHT;
    const runOutLabelY = isDefined(runOutY) ? runOutY - LABEL_BOTTOM_OFFSET : 0;

    return (
        <Card className="gap-y-xl">
            <View className="flex-row items-center justify-between">
                <Text className="text-xxs uppercase tracking-wider text-secondary-foreground">
                    <Trans>Balance forecast</Trans>
                </Text>
                <Text className="text-xxs text-secondary-foreground">
                    <Trans>median · p25–p75</Trans>
                </Text>
            </View>

            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                <Line x1={CHART_PADDING_LEFT} y1={geometry.zeroY} x2={chartRight} y2={geometry.zeroY} stroke={RUNWAY_CHART_COLORS.zero} />
                <Path d={geometry.bandPath} fill={RUNWAY_CHART_COLORS.bandFill} stroke={RUNWAY_CHART_COLORS.bandStroke} strokeWidth={1} />
                <Path
                    d={geometry.medianPath}
                    fill="none"
                    stroke={RUNWAY_CHART_COLORS.median}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {isDefined(runOutX) && isDefined(runOutY) && isNotEmptyString(runOutLabel) ? (
                    <RunwayForecastRunOutMarker x={runOutX} y={runOutY} labelY={runOutLabelY} label={runOutLabel} />
                ) : null}
                {geometry.tickXs.map((x, index) => (
                    <SvgText key={x} x={x} y={chartBottom} fill={RUNWAY_CHART_COLORS.label} fontSize={LABEL_FONT_SIZE} textAnchor="middle">
                        {tickLabels[index]}
                    </SvgText>
                ))}
            </Svg>

            <View className="flex-row gap-x-md">
                {RUNWAY_HORIZON_MONTHS.map(months => (
                    <RunwayHorizonChip
                        key={months}
                        months={months}
                        amount={convertFromMicroUnits(computation.liquid + computation.net * months)}
                    />
                ))}
            </View>
        </Card>
    );
};
