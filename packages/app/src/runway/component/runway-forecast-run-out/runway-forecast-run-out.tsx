import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { RUNWAY_CHART_LABEL_FONT_SIZE } from '../../constant/runway-chart-label-font-size.constant';

interface Props {
    readonly x: number;
    readonly top: number;
    readonly bottom: number;
    readonly label: string;
    readonly anchor: 'middle' | 'end';
}

const LABEL_GAP = 4;
const MARKER_RADIUS = 3.5;
const RUN_OUT_DASH = '2 3';

export const RunwayForecastRunOut = ({ x, top, bottom, label, anchor }: Props) => {
    const labelY = top - LABEL_GAP;

    return (
        <>
            <StyledLine
                x1={x}
                y1={top}
                x2={x}
                y2={bottom}
                strokeClassName="accent-destructive-foreground"
                strokeDasharray={RUN_OUT_DASH}
                strokeWidth={1}
            />
            <StyledCircle
                cx={x}
                cy={bottom}
                r={MARKER_RADIUS}
                fillClassName="accent-destructive-foreground"
                strokeClassName="accent-primary-reverse dark:accent-secondary-background"
                strokeWidth={1.5}
            />
            <StyledSvgText
                x={x}
                y={labelY}
                fillClassName="accent-destructive-foreground"
                fontSize={RUNWAY_CHART_LABEL_FONT_SIZE}
                fontWeight="600"
                textAnchor={anchor}
            >
                {label}
            </StyledSvgText>
        </>
    );
};
