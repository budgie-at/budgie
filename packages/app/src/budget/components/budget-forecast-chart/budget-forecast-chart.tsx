import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Svg from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { buildBudgetForecastGeometry } from '../../utils/build-budget-forecast-geometry.util';
import { BudgetForecastAxisLabels } from '../budget-forecast-axis-labels/budget-forecast-axis-labels';
import { BudgetForecastBills } from '../budget-forecast-bills/budget-forecast-bills';
import { BudgetForecastGradient } from '../budget-forecast-gradient/budget-forecast-gradient';
import { BudgetForecastLimit } from '../budget-forecast-limit/budget-forecast-limit';
import { BudgetForecastRunOut } from '../budget-forecast-run-out/budget-forecast-run-out';
import { BudgetForecastTodayMarker } from '../budget-forecast-today-marker/budget-forecast-today-marker';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 150;
const CHART_PADDING_X = 8;
const CHART_PADDING_TOP = 22;
const CHART_PADDING_BOTTOM = 18;
const LABEL_FONT_SIZE = 8;
const DASH = '4 3';
const CHART_BOTTOM = CHART_HEIGHT - CHART_PADDING_BOTTOM;
const AXIS_LABEL_Y = CHART_HEIGHT - 4;
const AXIS_LABEL_CLEARANCE = 32;
const CHART_RIGHT = CHART_WIDTH - CHART_PADDING_X;
const PROJECTION_OPACITY = 0.55;
const GRADIENT_ID = 'budget-forecast-fill';
const TODAY_ACCENT_CLASS_NAME = {
    positive: 'accent-positive-foreground',
    warning: 'accent-warning-foreground',
    destructive: 'accent-destructive-foreground'
} as const;
const GRADIENT_CLASS_NAME = {
    positive: 'bg-positive-foreground',
    warning: 'bg-warning-foreground',
    destructive: 'bg-destructive-foreground'
} as const;
const AREA_FILL = `url(#${GRADIENT_ID})`;
const VIEW_BOX = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;

export const BudgetForecastChart = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();

    const { actualPath, actualAreaPath, projectedPath, limitY, todayX, todayPoint, runOutX, bills } = buildBudgetForecastGeometry({
        projection,
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        paddingLeft: CHART_PADDING_X,
        paddingRight: CHART_PADDING_X,
        paddingTop: CHART_PADDING_TOP,
        paddingBottom: CHART_PADDING_BOTTOM
    });
    const limitAmount = formatProtectedAmount(convertFromMicroUnits(projection.overall.limit), currencySymbol);
    const { runOutAt, status } = projection.overall;
    const accentClassName = TODAY_ACCENT_CLASS_NAME[BUDGET_PACE_VARIANT[status]];
    const gradientClassName = GRADIENT_CLASS_NAME[BUDGET_PACE_VARIANT[status]];
    const labelTodayX = Math.min(Math.max(todayX, CHART_PADDING_X + AXIS_LABEL_CLEARANCE), CHART_RIGHT - AXIS_LABEL_CLEARANCE);

    return (
        <Svg width="100%" height={CHART_HEIGHT} viewBox={VIEW_BOX}>
            <BudgetForecastGradient id={GRADIENT_ID} colorClassName={gradientClassName} />
            <BudgetForecastLimit
                y={limitY}
                left={CHART_PADDING_X}
                right={CHART_RIGHT}
                label={t`Limit ${limitAmount}`}
                fontSize={LABEL_FONT_SIZE}
                dash={DASH}
            />

            <StyledPath d={actualAreaPath} fill={AREA_FILL} />
            <StyledPath
                d={projectedPath}
                fill="none"
                strokeClassName="accent-primary"
                strokeDasharray={DASH}
                strokeOpacity={PROJECTION_OPACITY}
                strokeWidth={2}
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
                    runOutAt={runOutAt}
                    fontSize={LABEL_FONT_SIZE}
                    dash={DASH}
                />
            ) : null}

            {isDefined(todayPoint) ? <BudgetForecastTodayMarker point={todayPoint} accentClassName={accentClassName} /> : null}

            <BudgetForecastAxisLabels
                days={projection.days}
                todayIndex={projection.elapsedDays - 1}
                leftX={CHART_PADDING_X}
                todayX={labelTodayX}
                rightX={CHART_RIGHT}
                y={AXIS_LABEL_Y}
                fontSize={LABEL_FONT_SIZE}
            />
        </Svg>
    );
};
