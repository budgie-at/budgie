import { useState } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useBudgetForecastLabels } from '../../hooks/use-budget-forecast-labels.hook';
import { buildBudgetForecastGeometry } from '../../utils/build-budget-forecast-geometry.util';
import { resolveBudgetForecastDomain } from '../../utils/resolve-budget-forecast-domain.util';
import { resolveBudgetForecastLabelLane } from '../../utils/resolve-budget-forecast-label-lane.util';
import { BudgetForecastAxisLabels } from '../budget-forecast-axis-labels/budget-forecast-axis-labels';
import { BudgetForecastBills } from '../budget-forecast-bills/budget-forecast-bills';
import { BudgetForecastEnd } from '../budget-forecast-end/budget-forecast-end';
import { BudgetForecastLimit } from '../budget-forecast-limit/budget-forecast-limit';
import { BudgetForecastLines } from '../budget-forecast-lines/budget-forecast-lines';
import { BudgetForecastOffScaleLimit } from '../budget-forecast-off-scale-limit/budget-forecast-off-scale-limit';
import { BudgetForecastRunOut } from '../budget-forecast-run-out/budget-forecast-run-out';
import { BudgetForecastTodayMarker } from '../budget-forecast-today-marker/budget-forecast-today-marker';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';
import type { BudgetProjectionInterface } from '@budgie/budget';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly tone: BudgetPaceVariant;
    readonly currencySymbol: string;
}

const CHART_HEIGHT = 160;
const CHART_PADDING_LEFT = 0;
const CHART_PADDING_RIGHT = 6;
const CHART_PADDING_TOP = 22;
const CHART_RUN_OUT_PADDING_TOP = 36;
const RUN_OUT_ROW_HEIGHT = 22;
const LABEL_CHAR_WIDTH_RATIO = 0.56;
const CHART_PADDING_BOTTOM = 24;
const LABEL_FONT_SIZE = 11;
const DASH = '4 3';
const CHART_BOTTOM = CHART_HEIGHT - CHART_PADDING_BOTTOM;
const AXIS_LABEL_Y = CHART_HEIGHT - 4;
const TONE_STROKE_CLASS_NAME = {
    positive: 'accent-positive-fill',
    warning: 'accent-warning-fill',
    destructive: 'accent-destructive-fill'
} as const;
const GEOMETRY_LAYOUT = {
    height: CHART_HEIGHT,
    paddingLeft: CHART_PADDING_LEFT,
    paddingRight: CHART_PADDING_RIGHT,
    paddingBottom: CHART_PADDING_BOTTOM
};
const TONE_LABEL_CLASS_NAME = {
    positive: 'accent-positive-strong',
    warning: 'accent-warning-strong',
    destructive: 'accent-destructive-strong'
} as const;

export const BudgetForecastChart = ({ projection, tone, currencySymbol }: Props) => {
    const [width, setWidth] = useState(0);

    const handleLayout = (event: LayoutChangeEvent) => void setWidth(event.nativeEvent.layout.width);

    const { runOutAt } = projection.overall;
    const domain = resolveBudgetForecastDomain(projection);
    const hasTopRow = isDefined(runOutAt) || !domain.isLimitInRange;
    const paddingTop = hasTopRow ? CHART_RUN_OUT_PADDING_TOP : CHART_PADDING_TOP;
    const geometry = buildBudgetForecastGeometry({ projection, width, paddingTop, ...GEOMETRY_LAYOUT });
    const { actualPath, projectedPath, projectedEndPoint, limitY, todayX, todayPoint, runOutX, bills } = geometry;
    const { limitLabel, scaleLabel, endLabel } = useBudgetForecastLabels(projection.overall, currencySymbol, domain);
    const accentClassName = TONE_STROKE_CLASS_NAME[tone];
    const todayIndex = projection.elapsedDays - 1;
    const endLabelY = resolveBudgetForecastLabelLane({
        anchor: { x: width, y: isDefined(projectedEndPoint) ? projectedEndPoint.y : limitY },
        lines: geometry.lines,
        labelWidth: endLabel.length * LABEL_FONT_SIZE * LABEL_CHAR_WIDTH_RATIO,
        fontSize: LABEL_FONT_SIZE,
        limitY,
        top: hasTopRow ? RUN_OUT_ROW_HEIGHT : 0,
        bottom: CHART_BOTTOM
    });

    return (
        <View className="h-[160px] w-full" onLayout={handleLayout}>
            {isPositiveNumber(width) ? (
                <Svg width={width} height={CHART_HEIGHT}>
                    {domain.isLimitInRange ? (
                        <BudgetForecastLimit
                            y={limitY}
                            left={CHART_PADDING_LEFT}
                            right={width}
                            label={limitLabel}
                            fontSize={LABEL_FONT_SIZE}
                        />
                    ) : (
                        <BudgetForecastOffScaleLimit
                            label={limitLabel}
                            scaleLabel={scaleLabel}
                            top={paddingTop}
                            fontSize={LABEL_FONT_SIZE}
                        />
                    )}

                    <BudgetForecastLines
                        actualPath={actualPath}
                        projectedPath={projectedPath}
                        accentClassName={accentClassName}
                        dash={DASH}
                    />

                    <BudgetForecastBills bills={bills} />

                    {isDefined(runOutX) && isDefined(runOutAt) ? (
                        <BudgetForecastRunOut
                            x={runOutX}
                            top={paddingTop}
                            bottom={CHART_BOTTOM}
                            width={width}
                            runOutAt={runOutAt}
                            fontSize={LABEL_FONT_SIZE}
                            dash={DASH}
                        />
                    ) : null}

                    {isDefined(projectedEndPoint) ? (
                        <BudgetForecastEnd
                            point={projectedEndPoint}
                            label={endLabel}
                            labelY={endLabelY}
                            right={width}
                            strokeClassName={accentClassName}
                            labelClassName={TONE_LABEL_CLASS_NAME[tone]}
                            fontSize={LABEL_FONT_SIZE}
                        />
                    ) : null}

                    {isDefined(todayPoint) ? <BudgetForecastTodayMarker point={todayPoint} accentClassName={accentClassName} /> : null}

                    <BudgetForecastAxisLabels
                        days={projection.days}
                        todayIndex={todayIndex}
                        leftX={CHART_PADDING_LEFT}
                        todayX={todayX}
                        rightX={width}
                        y={AXIS_LABEL_Y}
                        fontSize={LABEL_FONT_SIZE}
                    />
                </Svg>
            ) : null}
        </View>
    );
};
