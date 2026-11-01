import type { BudgetPaceVariant } from '../type/budget-pace-variant.type';

export const BUDGET_PACE_TEXT_CLASS_NAME: Record<BudgetPaceVariant, string> = {
    positive: 'text-positive-strong',
    warning: 'text-warning-strong',
    destructive: 'text-destructive-strong'
};
