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

const MIN_BAR_HEIGHT = 1.5;
const CAP_WIDTH = 2;
const ESTIMATED_OPACITY = 0.5;
const CURRENT_OPACITY = 0.35;

export const BudgetHistoryBarShape = ({ centerX, barWidth, spent, limit, scaleMax, isCurrent, isEstimated }: Props) => {
    const scale = BUDGET_HISTORY_BAR_AREA_HEIGHT / scaleMax;
    const barHeight = isPositiveNumber(spent) ? Math.max(spent * scale, MIN_BAR_HEIGHT) : 0;
    const limitY = BUDGET_HISTORY_BASELINE_Y - limit * scale;
    const capY = BUDGET_HISTORY_BASELINE_Y - barHeight;
    const isOver = spent > limit;
    const fillClassName = isOver ? 'accent-destructive-fill' : 'accent-positive-fill';
    const settledOpacity = isEstimated ? ESTIMATED_OPACITY : 1;
    const barOpacity = isCurrent ? CURRENT_OPACITY : settledOpacity;
    const barLeft = centerX - barWidth / 2;
    const barRight = centerX + barWidth / 2;
    const barPath = buildBudgetHistoryBarPath(barLeft, BUDGET_HISTORY_BASELINE_Y, barWidth, barHeight);
    const cap = isCurrent ? (
        <StyledLine x1={barLeft} y1={capY} x2={barRight} y2={capY} strokeClassName={fillClassName} strokeWidth={CAP_WIDTH} />
    ) : null;

    return (
        <>
            <StyledPath d={barPath} fillClassName={fillClassName} opacity={barOpacity} />
            {cap}
            <StyledLine x1={barLeft} y1={limitY} x2={barRight} y2={limitY} strokeClassName="accent-primary" strokeWidth={1} />
        </>
    );
};
