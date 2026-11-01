import { convertFromMicroUnits } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

const PERCENT_MULTIPLIER = 100;

export const buildBudgetProgressBarMetrics = (spent: number, limit: number) => ({
    displayLimit: convertFromMicroUnits(limit),
    displaySpent: convertFromMicroUnits(spent),
    percentLabel: `${Math.round((isPositiveNumber(limit) ? spent / limit : 0) * PERCENT_MULTIPLIER)}%`
});
