import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AreaGradient } from '../../../@generic/component/area-gradient/area-gradient';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { STATUS_TONE_FILL_CLASS_NAME } from '../../../@generic/constant/status-tone-fill-class-name.constant';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { buildRunwayForecastPath } from '../../utils/build-forecast-path.util';
import { RunwayForecastAxisLabels } from '../runway-forecast-axis-labels/runway-forecast-axis-labels';
import { RunwayForecastLegend } from '../runway-forecast-legend/runway-forecast-legend';
import { RunwayForecastRunOut } from '../runway-forecast-run-out/runway-forecast-run-out';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 140;
const CHART_PADDING_X = 4;
const CHART_PADDING_TOP = 22;
const CHART_PADDING_BOTTOM = 24;
const RUN_OUT_ANCHOR_RATIO = 0.82;
const BAND_OPACITY = 0.5;
const GRADIENT_ID = 'runway-forecast-fill';
const AREA_FILL = `url(#${GRADIENT_ID})`;
const VIEW_BOX = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;
const CHART_RIGHT = CHART_WIDTH - CHART_PADDING_X;
const AXIS_LABEL_Y = CHART_HEIGHT - 4;
const CHART_ASPECT_STYLE = { aspectRatio: CHART_WIDTH / CHART_HEIGHT };

export const RunwayForecastChart = ({ computation }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndYear } = useFormatDate();

    const { bandPath, likelyAreaPath, likelyPath, runOutX, tickXs, zeroY } = buildRunwayForecastPath({
        computation,
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        paddingLeft: CHART_PADDING_X,
        paddingRight: CHART_PADDING_X,
        paddingTop: CHART_PADDING_TOP,
        paddingBottom: CHART_PADDING_BOTTOM
    });
    const runOutLabel = isDefined(computation.runsOutAt) ? formatMonthAndYear(computation.runsOutAt) : '';
    const runOutAnchor = isDefined(runOutX) && runOutX > CHART_WIDTH * RUN_OUT_ANCHOR_RATIO ? 'end' : 'middle';
    const gradientClassName = STATUS_TONE_FILL_CLASS_NAME[computation.isPositive ? 'positive' : 'destructive'];

    return (
        <View className="gap-y-lg">
            <SectionHeader label={t`Balance forecast`} />

            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <View className="w-full" style={CHART_ASPECT_STYLE}>
                    <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
                        <AreaGradient id={GRADIENT_ID} colorClassName={gradientClassName} />
                        <StyledLine x1={CHART_PADDING_X} y1={zeroY} x2={CHART_RIGHT} y2={zeroY} strokeClassName="accent-corner" />
                        <StyledPath
                            d={bandPath}
                            fillClassName="accent-ghost-background"
                            fillOpacity={BAND_OPACITY}
                            strokeClassName="accent-ghost-corner"
                            strokeOpacity={BAND_OPACITY}
                            strokeWidth={1}
                        />
                        <StyledPath d={likelyAreaPath} fill={AREA_FILL} />
                        <StyledPath
                            d={likelyPath}
                            fill="none"
                            strokeClassName="accent-primary"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {isDefined(runOutX) && isNotEmptyString(runOutLabel) ? (
                            <RunwayForecastRunOut
                                x={runOutX}
                                top={CHART_PADDING_TOP}
                                bottom={zeroY}
                                label={runOutLabel}
                                anchor={runOutAnchor}
                            />
                        ) : null}

                        <RunwayForecastAxisLabels tickXs={tickXs} y={AXIS_LABEL_Y} />
                    </Svg>
                </View>
            </View>

            <RunwayForecastLegend />
        </View>
    );
};
