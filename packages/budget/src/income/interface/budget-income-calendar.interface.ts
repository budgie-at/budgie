import type { BudgetIncomeCalendarEntryInterface } from './budget-income-calendar-entry.interface';

export interface BudgetIncomeCalendarInterface {
    readonly entriesByDay: ReadonlyMap<number, readonly BudgetIncomeCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: ReadonlyMap<number, readonly BudgetIncomeCalendarEntryInterface[]>;
}
