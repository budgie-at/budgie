import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';
import { RUNWAY_FORECAST_HORIZONS_MONTHS } from '../../constant/runway-forecast.constant';
import { buildRunwayForecastPath } from '../../utils/build-forecast-path.util';
import { RunwayForecastLegend } from '../runway-forecast-legend/runway-forecast-legend';
import { RunwayForecastRunOutMarker } from '../runway-forecast-run-out-marker/runway-forecast-run-out-marker';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 140;
const CHART_PADDING_LEFT = 36;
const CHART_PADDING_RIGHT = 6;
const CHART_PADDING_TOP = 18;
const CHART_PADDING_BOTTOM = 20;
const LABEL_FONT_SIZE = 8;
const ZERO_LABEL_GAP = 4;
const RUN_OUT_ANCHOR_RATIO = 0.82;

export const RunwayForecastChart = ({ computation }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndYear } = useFormatDate();
    const formatDigits = useFormatDigits(0);
    const { colorScheme } = useThemeContext();

    const colors = RUNWAY_CHART_COLORS[colorScheme];
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
    const { runOutX } = geometry;
    const chartBottom = CHART_HEIGHT - CHART_PADDING_BOTTOM;
    const chartRight = CHART_WIDTH - CHART_PADDING_RIGHT;
    const isRunOutNearEdge = isDefined(runOutX) && runOutX > CHART_WIDTH * RUN_OUT_ANCHOR_RATIO;
    const runOutAnchor = isRunOutNearEdge ? 'end' : 'middle';
    const zeroLabelY = geometry.zeroY - ZERO_LABEL_GAP;

    return (
        <Card className="gap-y-xl">
            <Text className="text-xxs uppercase tracking-wider text-secondary-foreground">
                <Trans>Balance forecast</Trans>
            </Text>

            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                <Line x1={CHART_PADDING_LEFT} y1={geometry.zeroY} x2={chartRight} y2={geometry.zeroY} stroke={colors.zero} />
                <SvgText x={chartRight} y={zeroLabelY} fill={colors.label} fontSize={LABEL_FONT_SIZE} textAnchor="end">
                    {t`empty`}
                </SvgText>
                <Path d={geometry.bandPath} fill={colors.bandFill} stroke={colors.bandStroke} strokeWidth={1} />
                <Path
                    d={geometry.medianPath}
                    fill="none"
                    stroke={colors.median}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {isDefined(runOutX) && isNotEmptyString(runOutLabel) ? (
                    <RunwayForecastRunOutMarker
                        x={runOutX}
                        topY={CHART_PADDING_TOP}
                        zeroY={geometry.zeroY}
                        label={runOutLabel}
                        textAnchor={runOutAnchor}
                    />
                ) : null}
                {geometry.tickXs.map((x, index) => (
                    <SvgText key={x} x={x} y={chartBottom} fill={colors.label} fontSize={LABEL_FONT_SIZE} textAnchor="middle">
                        {tickLabels[index]}
                    </SvgText>
                ))}
            </Svg>

            <RunwayForecastLegend />
        </Card>
    );
};
