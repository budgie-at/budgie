import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetIncomeMonthInterface } from '../interface/budget-income-month.interface';

export const computeExpectedIncome = (
    months: readonly BudgetIncomeMonthInterface[],
    window: BudgetPeriodWindowInterface,
    rate: number
): number => {
    const total = months
        .flatMap(({ month, calendar }) =>
            [...calendar.entriesByDay.values(), ...calendar.forecastedEntriesByDay.values()]
                .flat()
                .filter(entry => {
                    const entryTime = new Date(month.getFullYear(), month.getMonth(), entry.dayOfMonth).getTime();

                    return entryTime >= window.periodStart.getTime() && entryTime < window.nextPeriodStart.getTime();
                })
                .map(entry => entry.latestAmount)
        )
        .reduce((sum, amount) => sum + amount, 0);

    return Math.round(total * rate);
};
