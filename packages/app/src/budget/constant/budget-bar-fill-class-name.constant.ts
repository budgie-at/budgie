import type { BudgetPaceVariant } from '../type/budget-pace-variant.type';

export const BUDGET_BAR_FILL_CLASS_NAME: Record<BudgetPaceVariant, string> = {
    positive: 'bg-primary/85',
    warning: 'bg-warning-fill',
    destructive: 'bg-destructive-fill'
};
