import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Svg from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { buildBudgetForecastGeometry } from '../../utils/build-budget-forecast-geometry.util';
import { BudgetForecastBills } from '../budget-forecast-bills/budget-forecast-bills';
import { BudgetForecastRunOut } from '../budget-forecast-run-out/budget-forecast-run-out';

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
const LIMIT_LABEL_GAP = 4;
const DASH = '4 3';
const CHART_BOTTOM = CHART_HEIGHT - CHART_PADDING_BOTTOM;
const AXIS_LABEL_Y = CHART_HEIGHT - 4;
const CHART_RIGHT = CHART_WIDTH - CHART_PADDING_X;
const VIEW_BOX = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;

export const BudgetForecastChart = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const formatProtectedAmount = useProtectedAmountLabel();

    const { actualPath, projectedPath, limitY, todayX, runOutX, bills } = buildBudgetForecastGeometry({
        projection,
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        paddingLeft: CHART_PADDING_X,
        paddingRight: CHART_PADDING_X,
        paddingTop: CHART_PADDING_TOP,
        paddingBottom: CHART_PADDING_BOTTOM
    });
    const limitAmount = formatProtectedAmount(convertFromMicroUnits(projection.overall.limit), currencySymbol);
    const limitLabelY = limitY - LIMIT_LABEL_GAP;
    const { runOutAt } = projection.overall;

    return (
        <Svg width="100%" height={CHART_HEIGHT} viewBox={VIEW_BOX}>
            <StyledLine
                x1={CHART_PADDING_X}
                y1={limitY}
                x2={CHART_RIGHT}
                y2={limitY}
                strokeClassName="accent-secondary-foreground"
                strokeDasharray={DASH}
                strokeWidth={1}
            />
            <StyledSvgText
                x={CHART_RIGHT}
                y={limitLabelY}
                fillClassName="accent-secondary-foreground"
                fontSize={LABEL_FONT_SIZE}
                textAnchor="end"
            >
                {t`Limit ${limitAmount}`}
            </StyledSvgText>
            <StyledLine x1={todayX} y1={CHART_PADDING_TOP} x2={todayX} y2={CHART_BOTTOM} strokeClassName="accent-secondary-corner" />

            <StyledPath
                d={projectedPath}
                fill="none"
                strokeClassName="accent-secondary-foreground"
                strokeDasharray={DASH}
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

            <BudgetForecastBills bills={bills} fontSize={LABEL_FONT_SIZE} />

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

            <StyledSvgText x={CHART_PADDING_X} y={AXIS_LABEL_Y} fillClassName="accent-secondary-foreground" fontSize={LABEL_FONT_SIZE}>
                {formatMonthAndDay(projection.days[0].date)}
            </StyledSvgText>
            <StyledSvgText
                x={CHART_RIGHT}
                y={AXIS_LABEL_Y}
                fillClassName="accent-secondary-foreground"
                fontSize={LABEL_FONT_SIZE}
                textAnchor="end"
            >
                {formatMonthAndDay(projection.days[projection.days.length - 1].date)}
            </StyledSvgText>
        </Svg>
    );
};
