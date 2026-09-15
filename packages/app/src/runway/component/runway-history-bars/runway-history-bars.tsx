import { Rect } from 'react-native-svg';

import { isPositiveNumber } from '@rnw-community/shared';

import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';
import { RUNWAY_HISTORY_BAR_AREA_HEIGHT, RUNWAY_HISTORY_BAR_GAP } from '../../constant/runway-history.constant';

interface Props {
    readonly centerX: number;
    readonly barWidth: number;
    readonly baselineY: number;
    readonly expense: number;
    readonly income: number;
    readonly maxValue: number;
    readonly isSpike: boolean;
}

const BAR_RADIUS = 2;
const MIN_BAR_HEIGHT = 1.5;

export const RunwayHistoryBars = ({ centerX, barWidth, baselineY, expense, income, maxValue, isSpike }: Props) => {
    const { colorScheme } = useThemeContext();

    const colors = RUNWAY_CHART_COLORS[colorScheme];
    const scale = isPositiveNumber(maxValue) ? RUNWAY_HISTORY_BAR_AREA_HEIGHT / maxValue : 0;
    const expenseHeight = isPositiveNumber(expense) ? Math.max(expense * scale, MIN_BAR_HEIGHT) : 0;
    const incomeHeight = isPositiveNumber(income) ? Math.max(income * scale, MIN_BAR_HEIGHT) : 0;
    const expenseFill = isSpike ? colors.spike : colors.destructive;
    const expenseX = centerX - RUNWAY_HISTORY_BAR_GAP / 2 - barWidth;
    const incomeX = centerX + RUNWAY_HISTORY_BAR_GAP / 2;
    const expenseY = baselineY - expenseHeight;
    const incomeY = baselineY - incomeHeight;

    return (
        <>
            <Rect x={expenseX} y={expenseY} width={barWidth} height={expenseHeight} rx={BAR_RADIUS} fill={expenseFill} />
            <Rect x={incomeX} y={incomeY} width={barWidth} height={incomeHeight} rx={BAR_RADIUS} fill={colors.positive} />
        </>
    );
};
