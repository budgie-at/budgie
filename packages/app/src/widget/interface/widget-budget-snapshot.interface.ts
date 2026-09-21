import type { WidgetBudgetCategoryInterface } from './widget-budget-category.interface';

export interface WidgetBudgetSnapshotInterface {
    readonly formattedSpent: string;
    readonly formattedLimit: string;
    readonly formattedRemaining: string;
    readonly progressRatio: number;
    readonly isOverLimit: boolean;
    readonly formattedDaysLeft: string;
    readonly formattedSafePerDay: string;
    readonly periodLabel: string;
    readonly categories: readonly WidgetBudgetCategoryInterface[];
}
