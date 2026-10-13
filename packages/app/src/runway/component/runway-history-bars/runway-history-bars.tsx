import { Rect } from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { isPositiveNumber } from '@rnw-community/shared';

import { SVG_COLOR_CLASS_NAME_MAPPING } from '../../../@generic/constant/svg-color-class-name-mapping.constant';
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

const StyledRect = withUniwind(Rect, SVG_COLOR_CLASS_NAME_MAPPING);

export const RunwayHistoryBars = ({ centerX, barWidth, baselineY, expense, income, maxValue, isSpike }: Props) => {
    const scale = isPositiveNumber(maxValue) ? RUNWAY_HISTORY_BAR_AREA_HEIGHT / maxValue : 0;
    const expenseHeight = isPositiveNumber(expense) ? Math.max(expense * scale, MIN_BAR_HEIGHT) : 0;
    const incomeHeight = isPositiveNumber(income) ? Math.max(income * scale, MIN_BAR_HEIGHT) : 0;
    const expenseFillClassName = isSpike ? 'accent-warning-foreground' : 'accent-destructive-foreground';
    const expenseX = centerX - RUNWAY_HISTORY_BAR_GAP / 2 - barWidth;
    const incomeX = centerX + RUNWAY_HISTORY_BAR_GAP / 2;
    const expenseY = baselineY - expenseHeight;
    const incomeY = baselineY - incomeHeight;

    return (
        <>
            <StyledRect
                x={expenseX}
                y={expenseY}
                width={barWidth}
                height={expenseHeight}
                rx={BAR_RADIUS}
                fillClassName={expenseFillClassName}
            />
            <StyledRect
                x={incomeX}
                y={incomeY}
                width={barWidth}
                height={incomeHeight}
                rx={BAR_RADIUS}
                fillClassName="accent-positive-foreground"
            />
        </>
    );
};
