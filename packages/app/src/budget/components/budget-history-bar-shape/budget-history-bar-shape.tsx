import { isPositiveNumber } from '@rnw-community/shared';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { BUDGET_HISTORY_BAR_AREA_HEIGHT, BUDGET_HISTORY_BASELINE_Y } from '../../constant/budget-history-chart.constant';
import { buildBudgetHistoryBarPath } from '../../utils/build-budget-history-bar-path.util';

interface Props {
    readonly centerX: number;
    readonly barWidth: number;
    readonly spent: number;
    readonly limit: number;
    readonly scaleMax: number;
    readonly isCurrent: boolean;
    readonly isEstimated: boolean;
}

const BAR_RADIUS = 3;
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
    const barPath = buildBudgetHistoryBarPath(centerX - barWidth / 2, BUDGET_HISTORY_BASELINE_Y, barWidth, barHeight, BAR_RADIUS);
    const limitStartX = centerX - barWidth;
    const limitEndX = centerX + barWidth;
    const solidProps = { fillClassName: toneClassName, opacity: isEstimated ? ESTIMATED_OPACITY : 1 };

    return (
        <>
            <StyledPath d={barPath} {...(isCurrent ? outlineProps : solidProps)} />
            <StyledLine
                x1={limitStartX}
                y1={limitY}
                x2={limitEndX}
                y2={limitY}
                strokeClassName="accent-primary"
                strokeDasharray={LIMIT_DASH}
                strokeWidth={1}
            />
        </>
    );
};
