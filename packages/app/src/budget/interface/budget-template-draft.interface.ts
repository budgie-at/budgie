import type { BudgetFormValues } from '../constant/budget-form-schema.constant';

export interface BudgetTemplateDraftInterface {
    readonly overallLimit: number;
    readonly categoryLimits: readonly BudgetFormValues['categoryLimits'][number][];
}
