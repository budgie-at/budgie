import { Line } from 'react-native-svg';

import { isPositiveNumber } from '@rnw-community/shared';

import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';
import {
    RUNWAY_HISTORY_BAR_AREA_HEIGHT,
    RUNWAY_HISTORY_CHART_WIDTH,
    RUNWAY_HISTORY_PLOT_TOP
} from '../../constant/runway-history.constant';

interface Props {
    readonly value: number;
    readonly maxValue: number;
}

const MEDIAN_DASH = '2 3';

export const RunwayHistoryMedianLine = ({ value, maxValue }: Props) => {
    const colors = RUNWAY_CHART_COLORS[useThemeContext().colorScheme];
    const ratio = isPositiveNumber(maxValue) ? Math.min(value / maxValue, 1) : 0;
    const medianY = RUNWAY_HISTORY_PLOT_TOP + RUNWAY_HISTORY_BAR_AREA_HEIGHT * (1 - ratio);

    return (
        <Line
            x1={0}
            y1={medianY}
            x2={RUNWAY_HISTORY_CHART_WIDTH}
            y2={medianY}
            stroke={colors.median}
            strokeDasharray={MEDIAN_DASH}
            strokeWidth={1}
        />
    );
};
