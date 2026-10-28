import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';

import type { BudgetForecastPointInterface } from '../../interface/budget-forecast-point.interface';

interface Props {
    readonly point: BudgetForecastPointInterface;
    readonly label: string;
    readonly isOver: boolean;
    readonly right: number;
    readonly strokeClassName: string;
    readonly labelClassName: string;
    readonly fontSize: number;
}

const RING_RADIUS = 4;
const RING_STROKE_WIDTH = 2;
const LABEL_ABOVE_OFFSET = -10;
const LABEL_BELOW_OFFSET = 28;

export const BudgetForecastEnd = ({ point, label, isOver, right, strokeClassName, labelClassName, fontSize }: Props) => {
    const labelY = point.y + (isOver ? LABEL_ABOVE_OFFSET : LABEL_BELOW_OFFSET);

    return (
        <>
            <StyledCircle
                cx={point.x}
                cy={point.y}
                r={RING_RADIUS}
                fill="none"
                strokeClassName={strokeClassName}
                strokeWidth={RING_STROKE_WIDTH}
            />
            <StyledSvgText x={right} y={labelY} fillClassName={labelClassName} fontSize={fontSize} fontWeight="600" textAnchor="end">
                {label}
            </StyledSvgText>
        </>
    );
};
