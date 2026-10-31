import { isPositiveNumber } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { buildRoundedTopBarPath } from '../../../@generic/utils/build-rounded-top-bar-path.util';
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

const MIN_BAR_HEIGHT = 1.5;
const INCOME_OPACITY = 0.45;

export const RunwayHistoryBars = ({ centerX, barWidth, baselineY, expense, income, maxValue, isSpike }: Props) => {
    const scale = isPositiveNumber(maxValue) ? RUNWAY_HISTORY_BAR_AREA_HEIGHT / maxValue : 0;
    const expenseHeight = isPositiveNumber(expense) ? Math.max(expense * scale, MIN_BAR_HEIGHT) : 0;
    const incomeHeight = isPositiveNumber(income) ? Math.max(income * scale, MIN_BAR_HEIGHT) : 0;
    const expenseFillClassName = isSpike ? 'accent-warning-fill' : 'accent-primary';
    const expenseX = centerX - RUNWAY_HISTORY_BAR_GAP / 2 - barWidth;
    const incomeX = centerX + RUNWAY_HISTORY_BAR_GAP / 2;
    const expensePath = buildRoundedTopBarPath(expenseX, baselineY, barWidth, expenseHeight);
    const incomePath = buildRoundedTopBarPath(incomeX, baselineY, barWidth, incomeHeight);

    return (
        <>
            <StyledPath d={expensePath} fillClassName={expenseFillClassName} />
            <StyledPath d={incomePath} fillClassName="accent-primary" opacity={INCOME_OPACITY} />
        </>
    );
};
