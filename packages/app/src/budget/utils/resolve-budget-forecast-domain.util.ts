import { isDefined } from '@rnw-community/shared';

import type { BudgetForecastDomainInterface } from '../interface/budget-forecast-domain.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

const VALUE_HEADROOM = 1.05;
const DATA_HEADROOM = 1.25;
const FAR_LIMIT_RATIO = 0.5;

export const resolveBudgetForecastDomain = (
    projection: Pick<BudgetProjectionInterface, 'days' | 'overall'>
): BudgetForecastDomainInterface => {
    const values = projection.days.flatMap(day => [day.actual, day.projected]).filter(isDefined);
    const peak = Math.max(...values, 1);
    const { limit } = projection.overall;
    const isLimitInRange = peak >= limit * FAR_LIMIT_RATIO;

    return { maxValue: isLimitInRange ? Math.max(limit, peak) * VALUE_HEADROOM : peak * DATA_HEADROOM, isLimitInRange };
};
