import type { BudgetIncomeCalendarInterface } from './budget-income-calendar.interface';

export interface BudgetIncomeMonthInterface {
    readonly month: Date;
    readonly calendar: BudgetIncomeCalendarInterface;
}
