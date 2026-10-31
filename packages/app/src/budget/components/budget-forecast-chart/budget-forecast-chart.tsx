import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { useProtectedWholeAmountLabel } from '../../../@generic/hook/use-protected-whole-amount-label.hook';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { buildBudgetForecastGeometry } from '../../utils/build-budget-forecast-geometry.util';
import { resolveBudgetForecastEndLabelY } from '../../utils/resolve-budget-forecast-end-label-y.util';
import { BudgetForecastAxisLabels } from '../budget-forecast-axis-labels/budget-forecast-axis-labels';
import { BudgetForecastBills } from '../budget-forecast-bills/budget-forecast-bills';
import { BudgetForecastEnd } from '../budget-forecast-end/budget-forecast-end';
import { BudgetForecastLimit } from '../budget-forecast-limit/budget-forecast-limit';
import { BudgetForecastRunOut } from '../budget-forecast-run-out/budget-forecast-run-out';
import { BudgetForecastTodayMarker } from '../budget-forecast-today-marker/budget-forecast-today-marker';

import type { BudgetProjectionInterface } from '@budgie/budget';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

const CHART_HEIGHT = 160;
const CHART_PADDING_LEFT = 0;
const CHART_PADDING_RIGHT = 6;
const CHART_PADDING_TOP = 30;
const CHART_PADDING_BOTTOM = 24;
const LABEL_FONT_SIZE = 11;
const DASH = '4 3';
const CHART_BOTTOM = CHART_HEIGHT - CHART_PADDING_BOTTOM;
const AXIS_LABEL_Y = CHART_HEIGHT - 4;
const PROJECTION_STROKE_WIDTH = 2;
const TONE_STROKE_CLASS_NAME = {
    positive: 'accent-positive-fill',
    warning: 'accent-warning-fill',
    destructive: 'accent-destructive-fill'
} as const;
const GEOMETRY_LAYOUT = {
    height: CHART_HEIGHT,
    paddingLeft: CHART_PADDING_LEFT,
    paddingRight: CHART_PADDING_RIGHT,
    paddingTop: CHART_PADDING_TOP,
    paddingBottom: CHART_PADDING_BOTTOM
};
const TONE_LABEL_CLASS_NAME = {
    positive: 'accent-positive-strong',
    warning: 'accent-warning-strong',
    destructive: 'accent-destructive-strong'
} as const;

export const BudgetForecastChart = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const [width, setWidth] = useState(0);
    const formatWholeAmount = useProtectedWholeAmountLabel();

    const handleLayout = (event: LayoutChangeEvent) => void setWidth(event.nativeEvent.layout.width);

    const { actualPath, projectedPath, projectedEndPoint, limitY, todayX, todayPoint, runOutX, bills } = buildBudgetForecastGeometry({
        projection,
        width,
        ...GEOMETRY_LAYOUT
    });
    const { runOutAt, status, limit, projectedEnd } = projection.overall;
    const tone = BUDGET_PACE_VARIANT[status];
    const accentClassName = TONE_STROKE_CLASS_NAME[tone];
    const isOver = isDefined(projectedEnd) && projectedEnd > limit;
    const gapAmount = formatWholeAmount(convertFromMicroUnits(Math.abs(limit - (projectedEnd ?? limit))), currencySymbol);
    const projectedAmount = formatWholeAmount(convertFromMicroUnits(projectedEnd ?? limit), currencySymbol);
    const limitAmount = formatWholeAmount(convertFromMicroUnits(limit), currencySymbol);
    const gapLabel = isOver ? t`${projectedAmount} · ${gapAmount} over` : t`${projectedAmount} · ${gapAmount} under`;
    const todayIndex = projection.elapsedDays - 1;

    return (
        <View className="h-[160px] w-full" onLayout={handleLayout}>
            {isPositiveNumber(width) ? (
                <Svg width={width} height={CHART_HEIGHT}>
                    <BudgetForecastLimit
                        y={limitY}
                        left={CHART_PADDING_LEFT}
                        right={width}
                        label={t`Limit ${limitAmount}`}
                        fontSize={LABEL_FONT_SIZE}
                    />

                    <StyledPath
                        d={projectedPath}
                        fill="none"
                        strokeClassName={accentClassName}
                        strokeDasharray={DASH}
                        strokeWidth={PROJECTION_STROKE_WIDTH}
                        strokeLinecap="round"
                    />
                    <StyledPath
                        d={actualPath}
                        fill="none"
                        strokeClassName="accent-primary"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    <BudgetForecastBills bills={bills} />

                    {isDefined(runOutX) && isDefined(runOutAt) ? (
                        <BudgetForecastRunOut
                            x={runOutX}
                            top={CHART_PADDING_TOP}
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
                            label={gapLabel}
                            labelY={resolveBudgetForecastEndLabelY(projectedEndPoint.y, limitY, LABEL_FONT_SIZE, CHART_BOTTOM)}
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
