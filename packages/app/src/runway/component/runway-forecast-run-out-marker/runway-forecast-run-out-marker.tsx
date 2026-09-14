import { Circle, Line, Text as SvgText } from 'react-native-svg';

import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';

interface Props {
    readonly x: number;
    readonly topY: number;
    readonly zeroY: number;
    readonly label: string;
    readonly textAnchor: 'end' | 'middle';
}

const RUN_OUT_DASH = '2 3';
const LABEL_FONT_SIZE = 8;
const LABEL_GAP = 4;
const MARKER_RADIUS = 3.5;

export const RunwayForecastRunOutMarker = ({ x, topY, zeroY, label, textAnchor }: Props) => {
    const { colorScheme } = useThemeContext();
    const colors = RUNWAY_CHART_COLORS[colorScheme];
    const labelY = topY - LABEL_GAP;

    return (
        <>
            <Line x1={x} y1={topY} x2={x} y2={zeroY} stroke={colors.destructive} strokeDasharray={RUN_OUT_DASH} strokeWidth={1} />
            <Circle cx={x} cy={zeroY} r={MARKER_RADIUS} fill={colors.destructive} stroke={colors.markerBackground} strokeWidth={1.5} />
            <SvgText x={x} y={labelY} fill={colors.destructive} fontSize={LABEL_FONT_SIZE} fontWeight="600" textAnchor={textAnchor}>
                {label}
            </SvgText>
        </>
    );
};
