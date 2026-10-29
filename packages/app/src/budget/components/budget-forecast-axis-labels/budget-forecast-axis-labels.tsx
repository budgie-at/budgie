import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly days: BudgetProjectionInterface['days'];
    readonly todayIndex: number;
    readonly leftX: number;
    readonly todayX: number;
    readonly rightX: number;
    readonly y: number;
    readonly fontSize: number;
}

const EDGE_HIDE_RATIO = 0.18;
const TODAY_LABEL_HALF_WIDTH = 22;

export const BudgetForecastAxisLabels = ({ days, todayIndex, leftX, todayX, rightX, y, fontSize }: Props) => {
    const { formatMonthAndDay } = useFormatDate();
    const todayDate = days[Math.min(Math.max(todayIndex, 0), days.length - 1)].date;
    const hideDistance = (rightX - leftX) * EDGE_HIDE_RATIO;
    const labelTodayX = Math.min(Math.max(todayX, leftX + TODAY_LABEL_HALF_WIDTH), rightX - TODAY_LABEL_HALF_WIDTH);
    const startLabel =
        todayX - leftX < hideDistance ? null : (
            <StyledSvgText x={leftX} y={y} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="start">
                {formatMonthAndDay(days[0].date)}
            </StyledSvgText>
        );
    const endLabel =
        rightX - todayX < hideDistance ? null : (
            <StyledSvgText x={rightX} y={y} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="end">
                {formatMonthAndDay(days[days.length - 1].date)}
            </StyledSvgText>
        );

    return (
        <>
            {startLabel}
            <StyledSvgText x={labelTodayX} y={y} fillClassName="accent-primary" fontSize={fontSize} fontWeight="600" textAnchor="middle">
                {formatMonthAndDay(todayDate)}
            </StyledSvgText>
            {endLabel}
        </>
    );
};
