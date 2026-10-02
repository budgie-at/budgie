import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';
import { RUNWAY_HORIZON_MONTHS } from '../../constant/runway-horizon-months.constant';
import { buildRunwayForecastPath } from '../../utils/build-forecast-path.util';

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
const LABEL_GAP = 4;
const MARKER_RADIUS = 3.5;
const RUN_OUT_DASH = '2 3';
const RUN_OUT_ANCHOR_RATIO = 0.82;
const CHART_RIGHT = CHART_WIDTH - CHART_PADDING_RIGHT;
const CHART_BOTTOM = CHART_HEIGHT - CHART_PADDING_BOTTOM;
const RUN_OUT_LABEL_Y = CHART_PADDING_TOP - LABEL_GAP;

export const RunwayForecastChart = ({ computation }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndYear } = useFormatDate();
    const formatDigits = useFormatDigits(0);
    const colors = RUNWAY_CHART_COLORS[useThemeContext().colorScheme];

    const { bandPath, medianPath, runOutX, tickXs, zeroY } = buildRunwayForecastPath({
        computation,
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        paddingLeft: CHART_PADDING_LEFT,
        paddingRight: CHART_PADDING_RIGHT,
        paddingTop: CHART_PADDING_TOP,
        paddingBottom: CHART_PADDING_BOTTOM
    });
    const tickLabels = RUNWAY_HORIZON_MONTHS.map((months, index) => (index === 0 ? t`now` : formatDigits(months)));
    const runOutLabel = isDefined(computation.runsOutAt) ? formatMonthAndYear(computation.runsOutAt) : '';
    const runOutAnchor = isDefined(runOutX) && runOutX > CHART_WIDTH * RUN_OUT_ANCHOR_RATIO ? 'end' : 'middle';

    return (
        <Card className="gap-y-xl">
            <Text className="text-xxs uppercase tracking-wider text-secondary-foreground">
                <Trans>Balance forecast</Trans>
            </Text>

            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                <Line x1={CHART_PADDING_LEFT} y1={zeroY} x2={CHART_RIGHT} y2={zeroY} stroke={colors.zero} />
                <Path d={bandPath} fill={colors.bandFill} stroke={colors.bandStroke} strokeWidth={1} />
                <Path d={medianPath} fill="none" stroke={colors.median} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

                {isDefined(runOutX) && isNotEmptyString(runOutLabel) ? (
                    <>
                        <Line
                            x1={runOutX}
                            y1={CHART_PADDING_TOP}
                            x2={runOutX}
                            y2={zeroY}
                            stroke={colors.destructive}
                            strokeDasharray={RUN_OUT_DASH}
                            strokeWidth={1}
                        />
                        <Circle
                            cx={runOutX}
                            cy={zeroY}
                            r={MARKER_RADIUS}
                            fill={colors.destructive}
                            stroke={colors.markerBackground}
                            strokeWidth={1.5}
                        />
                        <SvgText
                            x={runOutX}
                            y={RUN_OUT_LABEL_Y}
                            fill={colors.destructive}
                            fontSize={LABEL_FONT_SIZE}
                            fontWeight="600"
                            textAnchor={runOutAnchor}
                        >
                            {runOutLabel}
                        </SvgText>
                    </>
                ) : null}

                {tickXs.map((x, index) => (
                    <SvgText key={x} x={x} y={CHART_BOTTOM} fill={colors.label} fontSize={LABEL_FONT_SIZE} textAnchor="middle">
                        {tickLabels[index]}
                    </SvgText>
                ))}
            </Svg>

            <View className="gap-y-xs">
                <View className="flex-row items-center gap-x-sm">
                    <View className="h-0.5 w-4 rounded-full bg-primary" />
                    <Text className="text-xxs text-secondary-foreground">
                        <Trans>Most likely balance</Trans>
                    </Text>
                </View>

                <View className="flex-row items-center gap-x-sm">
                    <View className="h-3 w-4 rounded-sm border border-ghost-corner bg-ghost-background" />
                    <Text className="text-xxs text-secondary-foreground">
                        <Trans>Range across better and worse months</Trans>
                    </Text>
                </View>
            </View>
        </Card>
    );
};
