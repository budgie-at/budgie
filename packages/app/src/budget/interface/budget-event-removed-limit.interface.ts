import type { BudgetEventFormValues } from '../constant/budget-event-form-schema.constant';

export interface BudgetEventRemovedLimitInterface {
    readonly index: number;
    readonly limit: BudgetEventFormValues['categoryLimits'][number];
}
