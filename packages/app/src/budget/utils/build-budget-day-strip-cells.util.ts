import { BudgetPeriodEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { resolveBudgetDayState } from './resolve-budget-day-state.util';

import type { BudgetDayStripCellInterface } from '../interface/budget-day-strip-cell.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

const DAYS_PER_YEARLY_CELL = 7;

export const buildBudgetDayStripCells = (
    projection: Pick<BudgetProjectionInterface, 'days' | 'elapsedDays' | 'dailyAllowance'>,
    period: BudgetPeriodEnum
): BudgetDayStripCellInterface[] => {
    const { days, elapsedDays, dailyAllowance } = projection;
    const groupSize = period === BudgetPeriodEnum.YEARLY ? DAYS_PER_YEARLY_CELL : 1;
    const todayIndex = Math.floor((elapsedDays - 1) / groupSize);
    const groupCount = Math.ceil(days.length / groupSize);

    return Array.from({ length: groupCount }, (_unused, groupIndex) => {
        const group = days.slice(groupIndex * groupSize, (groupIndex + 1) * groupSize);
        const spentValues = group.map(day => day.variableSpent).filter(isDefined);
        const variableSpent = spentValues.length === 0 ? null : spentValues.reduce((sum, value) => sum + value, 0);

        return {
            key: group[0].date.getTime(),
            dayState: resolveBudgetDayState({ variableSpent }, groupIndex, todayIndex, dailyAllowance * group.length)
        };
    });
};
