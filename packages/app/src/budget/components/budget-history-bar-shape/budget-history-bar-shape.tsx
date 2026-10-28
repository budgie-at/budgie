import { isPositiveNumber } from '@rnw-community/shared';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledRect } from '../../../@generic/component/styled-rect/styled-rect';
import { BUDGET_HISTORY_BAR_AREA_HEIGHT, BUDGET_HISTORY_BASELINE_Y } from '../../constant/budget-history-chart.constant';

interface Props {
    readonly centerX: number;
    readonly barWidth: number;
    readonly spent: number;
    readonly limit: number;
    readonly scaleMax: number;
    readonly isCurrent: boolean;
    readonly isEstimated: boolean;
}

const BAR_RADIUS = 2;
const MIN_BAR_HEIGHT = 1.5;
const OUTLINE_WIDTH = 1.5;
const OUTLINE_DASH = '3 2';
const LIMIT_DASH = '2 2';
const ESTIMATED_OPACITY = 0.5;

export const BudgetHistoryBarShape = ({ centerX, barWidth, spent, limit, scaleMax, isCurrent, isEstimated }: Props) => {
    const scale = BUDGET_HISTORY_BAR_AREA_HEIGHT / scaleMax;
    const barHeight = isPositiveNumber(spent) ? Math.max(spent * scale, MIN_BAR_HEIGHT) : 0;
    const limitY = BUDGET_HISTORY_BASELINE_Y - limit * scale;
    const toneClassName = spent > limit ? 'accent-destructive-foreground' : 'accent-positive-foreground';
    const outlineProps = { fill: 'none', strokeWidth: OUTLINE_WIDTH, strokeDasharray: OUTLINE_DASH, strokeClassName: toneClassName };
    const solidProps = { fillClassName: toneClassName, opacity: isEstimated ? ESTIMATED_OPACITY : 1 };

    return (
        <>
            <StyledRect
                x={centerX - barWidth / 2}
                y={BUDGET_HISTORY_BASELINE_Y - barHeight}
                width={barWidth}
                height={barHeight}
                rx={BAR_RADIUS}
                {...(isCurrent ? outlineProps : solidProps)}
            />
            <StyledLine
                x1={centerX - barWidth}
                y1={limitY}
                x2={centerX + barWidth}
                y2={limitY}
                strokeClassName="accent-primary"
                strokeDasharray={LIMIT_DASH}
                strokeWidth={1}
            />
        </>
    );
};
