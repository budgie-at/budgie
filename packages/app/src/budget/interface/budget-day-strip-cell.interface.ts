import type { BudgetDayStateEnum } from '../enum/budget-day-state.enum';

export interface BudgetDayStripCellInterface {
    readonly key: number;
    readonly dayState: BudgetDayStateEnum;
}
