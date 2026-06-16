import { isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

const MIN_PROGRESS = 0;
const MAX_PROGRESS = 1;
const PERCENT_MULTIPLIER = 100;

export const buildBudgetProgressBarMetrics = (spent: number, limit: number) => {
    const ratio = isPositiveNumber(limit) ? spent / limit : 0;
    const clampedRatio = Math.max(MIN_PROGRESS, Math.min(MAX_PROGRESS, ratio));
    const displaySpent = convertFromMicroUnits(spent);
    const displayLimit = convertFromMicroUnits(limit);
    const remainingAmount = displayLimit - displaySpent;
    const displayRemaining = Math.abs(remainingAmount);
    const widthPercent: `${number}%` = `${clampedRatio * PERCENT_MULTIPLIER}%`;

    return {
        displayLimit,
        displayRemaining,
        displaySpent,
        isOverBudget: remainingAmount < 0,
        percentLabel: `${Math.round(ratio * PERCENT_MULTIPLIER)}%`,
        ratio,
        widthStyle: { width: widthPercent }
    };
};
