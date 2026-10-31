import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { RUNWAY_FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/runway-footnote-max-font-size-multiplier.constant';
import { useRunwayAmountLabel } from '../../hook/use-runway-amount-label.hook';
import { buildRunwayForecastPath } from '../../utils/build-forecast-path.util';
import { RunwayForecastAxisLabels } from '../runway-forecast-axis-labels/runway-forecast-axis-labels';
import { RunwayForecastRunOut } from '../runway-forecast-run-out/runway-forecast-run-out';
import { RunwayForecastValueLabel } from '../runway-forecast-value-label/runway-forecast-value-label';
import { RunwayForecastZeroLabel } from '../runway-forecast-zero-label/runway-forecast-zero-label';
import { RunwaySection } from '../runway-section/runway-section';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 152;
const CHART_PADDING_LEFT = 0;
const CHART_PADDING_RIGHT = 1;
const CHART_PADDING_TOP = 22;
const CHART_PADDING_BOTTOM = 36;
const RUN_OUT_ANCHOR_RATIO = 0.82;
const BAND_OPACITY = 0.16;
const VIEW_BOX = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;
const AXIS_LABEL_Y = CHART_HEIGHT - 4;
const CHART_ASPECT_STYLE = { aspectRatio: CHART_WIDTH / CHART_HEIGHT };

export const RunwayForecastChart = ({ computation }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndYear } = useFormatDate();

    const formatChartAmount = useRunwayAmountLabel(0);

    const { bandPath, likelyPath, runOutX, startLabelY, endLabelY, endValue, tickXs, zeroY } = buildRunwayForecastPath({
        computation,
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        paddingLeft: CHART_PADDING_LEFT,
        paddingRight: CHART_PADDING_RIGHT,
        paddingTop: CHART_PADDING_TOP,
        paddingBottom: CHART_PADDING_BOTTOM
    });
    const runOutLabel = isDefined(computation.runsOutAt) ? formatMonthAndYear(computation.runsOutAt) : '';
    const startLabel = formatChartAmount(computation.liquid);
    const chartSummary = isNotEmptyString(runOutLabel)
        ? t`Starts at ${startLabel}. Runs out around ${runOutLabel}.`
        : t`Starts at ${startLabel}.`;
    const runOutAnchor = isDefined(runOutX) && runOutX > CHART_WIDTH * RUN_OUT_ANCHOR_RATIO ? 'end' : 'middle';

    return (
        <RunwaySection
            title={t`Balance forecast`}
            footnote={
                <Text
                    maxFontSizeMultiplier={RUNWAY_FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                    className="px-3xl text-[13px] text-secondary-foreground"
                >
                    <Trans>Shading shows how much your months usually vary.</Trans>
                </Text>
            }
        >
            <View accessible accessibilityLabel={chartSummary} className="px-3xl pt-xl pb-md">
                <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className="w-full"
                    style={CHART_ASPECT_STYLE}
                >
                    <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
                        <StyledLine x1={CHART_PADDING_LEFT} y1={zeroY} x2={CHART_WIDTH} y2={zeroY} strokeClassName="accent-corner" />
                        <StyledPath d={bandPath} fillClassName="accent-primary" fillOpacity={BAND_OPACITY} />
                        <StyledPath
                            d={likelyPath}
                            fill="none"
                            strokeClassName="accent-primary"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        <RunwayForecastZeroLabel x={CHART_PADDING_LEFT} y={zeroY} />

                        <RunwayForecastValueLabel x={CHART_PADDING_LEFT} y={startLabelY} label={startLabel} anchor="start" />

                        <RunwayForecastValueLabel x={CHART_WIDTH} y={endLabelY} label={formatChartAmount(endValue)} anchor="end" />

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
        </RunwaySection>
    );
};
