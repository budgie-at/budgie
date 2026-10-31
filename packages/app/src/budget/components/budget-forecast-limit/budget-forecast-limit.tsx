import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';

interface Props {
    readonly y: number;
    readonly left: number;
    readonly right: number;
    readonly label: string;
    readonly fontSize: number;
    readonly isLabelBelow: boolean;
}

const END_MARKER_CLEARANCE = 6;
const LABEL_ABOVE_OFFSET = -4 - END_MARKER_CLEARANCE;
const LABEL_BELOW_OFFSET = 11 + END_MARKER_CLEARANCE;

export const BudgetForecastLimit = ({ y, left, right, label, fontSize, isLabelBelow }: Props) => {
    const labelY = y + (isLabelBelow ? LABEL_BELOW_OFFSET : LABEL_ABOVE_OFFSET);

    return (
        <>
            <StyledLine x1={left} y1={y} x2={right} y2={y} strokeClassName="accent-secondary-corner" strokeWidth={1} />
            <StyledSvgText x={right} y={labelY} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="end">
                {label}
            </StyledSvgText>
        </>
    );
};
