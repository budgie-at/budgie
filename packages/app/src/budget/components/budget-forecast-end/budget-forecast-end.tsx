import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';

import type { BudgetForecastPointInterface } from '../../interface/budget-forecast-point.interface';

interface Props {
    readonly point: BudgetForecastPointInterface;
    readonly label: string;
    readonly labelY: number;
    readonly right: number;
    readonly strokeClassName: string;
    readonly labelClassName: string;
    readonly fontSize: number;
}

const RING_RADIUS = 4;
const RING_STROKE_WIDTH = 2;
const HALO_WIDTH = 4;

export const BudgetForecastEnd = ({ point, label, labelY, right, strokeClassName, labelClassName, fontSize }: Props) => (
    <>
        <StyledCircle
            cx={point.x}
            cy={point.y}
            r={RING_RADIUS}
            fill="none"
            strokeClassName={strokeClassName}
            strokeWidth={RING_STROKE_WIDTH}
        />
        <StyledSvgText
            x={right}
            y={labelY}
            fillClassName="accent-primary-reverse"
            strokeClassName="accent-primary-reverse"
            strokeWidth={HALO_WIDTH}
            strokeLinejoin="round"
            fontSize={fontSize}
            fontWeight="600"
            textAnchor="end"
        >
            {label}
        </StyledSvgText>
        <StyledSvgText x={right} y={labelY} fillClassName={labelClassName} fontSize={fontSize} fontWeight="600" textAnchor="end">
            {label}
        </StyledSvgText>
    </>
);
