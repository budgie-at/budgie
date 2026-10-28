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

export const BudgetForecastAxisLabels = ({ days, todayIndex, leftX, todayX, rightX, y, fontSize }: Props) => {
    const { formatMonthAndDay } = useFormatDate();
    const todayDate = days[Math.min(Math.max(todayIndex, 0), days.length - 1)].date;

    return (
        <>
            <StyledSvgText x={leftX} y={y} fillClassName="accent-secondary-foreground" fontSize={fontSize}>
                {formatMonthAndDay(days[0].date)}
            </StyledSvgText>
            <StyledSvgText x={todayX} y={y} fillClassName="accent-primary" fontSize={fontSize} fontWeight="600" textAnchor="middle">
                {formatMonthAndDay(todayDate)}
            </StyledSvgText>
            <StyledSvgText x={rightX} y={y} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="end">
                {formatMonthAndDay(days[days.length - 1].date)}
            </StyledSvgText>
        </>
    );
};
