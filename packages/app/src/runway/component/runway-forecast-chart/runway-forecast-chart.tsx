import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { SVG_COLOR_CLASS_NAME_MAPPING } from '../../../@generic/constant/svg-color-class-name-mapping.constant';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { RUNWAY_HORIZON_MONTHS } from '../../constant/runway-horizon-months.constant';
import { buildRunwayForecastPath } from '../../utils/build-forecast-path.util';
import { RunwayForecastLegend } from '../runway-forecast-legend/runway-forecast-legend';

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

const StyledPath = withUniwind(Path, SVG_COLOR_CLASS_NAME_MAPPING);

export const RunwayForecastChart = ({ computation }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndYear } = useFormatDate();
    const formatDigits = useFormatDigits(0);

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
                <StyledLine x1={CHART_PADDING_LEFT} y1={zeroY} x2={CHART_RIGHT} y2={zeroY} strokeClassName="accent-corner" />
                <StyledPath d={bandPath} fillClassName="accent-ghost-background" strokeClassName="accent-ghost-corner" strokeWidth={1} />
                <StyledPath
                    d={medianPath}
                    fill="none"
                    strokeClassName="accent-primary"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {isDefined(runOutX) && isNotEmptyString(runOutLabel) ? (
                    <>
                        <StyledLine
                            x1={runOutX}
                            y1={CHART_PADDING_TOP}
                            x2={runOutX}
                            y2={zeroY}
                            strokeClassName="accent-destructive-foreground"
                            strokeDasharray={RUN_OUT_DASH}
                            strokeWidth={1}
                        />
                        <StyledCircle
                            cx={runOutX}
                            cy={zeroY}
                            r={MARKER_RADIUS}
                            fillClassName="accent-destructive-foreground"
                            strokeClassName="accent-primary-reverse dark:accent-secondary-background"
                            strokeWidth={1.5}
                        />
                        <StyledSvgText
                            x={runOutX}
                            y={RUN_OUT_LABEL_Y}
                            fillClassName="accent-destructive-foreground"
                            fontSize={LABEL_FONT_SIZE}
                            fontWeight="600"
                            textAnchor={runOutAnchor}
                        >
                            {runOutLabel}
                        </StyledSvgText>
                    </>
                ) : null}

                {tickXs.map((x, index) => (
                    <StyledSvgText
                        key={x}
                        x={x}
                        y={CHART_BOTTOM}
                        fillClassName="accent-secondary-foreground"
                        fontSize={LABEL_FONT_SIZE}
                        textAnchor="middle"
                    >
                        {tickLabels[index]}
                    </StyledSvgText>
                ))}
            </Svg>

            <RunwayForecastLegend />
        </Card>
    );
};
