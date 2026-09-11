import { Circle, Line, Text as SvgText } from 'react-native-svg';

import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';

interface Props {
    readonly x: number;
    readonly y: number;
    readonly labelY: number;
    readonly label: string;
}

const RUN_OUT_DASH = '2 3';
const LABEL_FONT_SIZE = 8;

export const RunwayForecastRunOutMarker = ({ x, y, labelY, label }: Props) => (
    <>
        <Line x1={x} y1={y} x2={x} y2={labelY} stroke={RUNWAY_CHART_COLORS.destructive} strokeDasharray={RUN_OUT_DASH} strokeWidth={1} />
        <Circle
            cx={x}
            cy={y}
            r={3}
            fill={RUNWAY_CHART_COLORS.destructive}
            stroke={RUNWAY_CHART_COLORS.markerBackground}
            strokeWidth={1.5}
        />
        <SvgText x={x} y={labelY} fill={RUNWAY_CHART_COLORS.destructive} fontSize={LABEL_FONT_SIZE} fontWeight="600" textAnchor="middle">
            {label}
        </SvgText>
    </>
);
