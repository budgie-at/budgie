import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly days: BudgetProjectionInterface['days'];
    readonly leftX: number;
    readonly midX: number;
    readonly rightX: number;
    readonly y: number;
    readonly fontSize: number;
}

export const BudgetForecastAxisLabels = ({ days, leftX, midX, rightX, y, fontSize }: Props) => {
    const { formatMonthAndDay } = useFormatDate();
    const midDate = days[Math.floor((days.length - 1) / 2)].date;

    return (
        <>
            <StyledSvgText x={leftX} y={y} fillClassName="accent-secondary-foreground" fontSize={fontSize}>
                {formatMonthAndDay(days[0].date)}
            </StyledSvgText>
            <StyledSvgText x={midX} y={y} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="middle">
                {formatMonthAndDay(midDate)}
            </StyledSvgText>
            <StyledSvgText x={rightX} y={y} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="end">
                {formatMonthAndDay(days[days.length - 1].date)}
            </StyledSvgText>
        </>
    );
};
