import { StyledLine } from '../../../@generic/component/styled-line/styled-line';

interface Props {
    readonly x: number;
    readonly height: number;
    readonly strokeClassName: string;
}

const RULE_OPACITY = 0.6;

export const YieldChartScrubRule = ({ x, height, strokeClassName }: Props) => (
    <StyledLine x1={x} y1={0} x2={x} y2={height} strokeClassName={strokeClassName} strokeWidth={1} strokeOpacity={RULE_OPACITY} />
);
