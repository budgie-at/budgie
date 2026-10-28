import type { BudgetPaceVariant } from '../type/budget-pace-variant.type';

export const BUDGET_PACE_FILL_CLASS_NAME: Record<BudgetPaceVariant, string> = {
    positive: 'bg-positive-foreground',
    warning: 'bg-warning-foreground',
    destructive: 'bg-destructive-foreground'
};
