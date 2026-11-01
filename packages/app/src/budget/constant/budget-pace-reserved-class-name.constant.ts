import type { BudgetPaceVariant } from '../type/budget-pace-variant.type';

export const BUDGET_PACE_RESERVED_CLASS_NAME: Record<BudgetPaceVariant, string> = {
    positive: 'bg-primary/25',
    warning: 'bg-warning-corner',
    destructive: 'bg-destructive-corner'
};
