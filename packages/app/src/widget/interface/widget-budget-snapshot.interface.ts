import type { StatusToneType } from '../../@generic/type/status-tone.type';
import type { WidgetBudgetCategoryInterface } from './widget-budget-category.interface';
import type { WidgetBudgetStatInterface } from './widget-budget-stat.interface';

export interface WidgetBudgetSnapshotInterface {
    readonly formattedAmount: string;
    readonly caption: string;
    readonly formattedPerDay: string;
    readonly formattedDaysLeft: string;
    readonly formattedSpent: string;
    readonly statusLabel: string;
    readonly tone: StatusToneType;
    readonly isOverLimit: boolean;
    readonly isMasked: boolean;
    readonly spentRatio: number;
    readonly elapsedRatio: number;
    readonly reservedRatio: number;
    readonly limitRatio: number | null;
    readonly categories: readonly WidgetBudgetCategoryInterface[];
    readonly formattedHiddenCategories: string;
    readonly formattedPeriod: string;
    readonly formattedReserved: string;
    readonly accessibilitySummary: string;
    readonly accessibilityDetail: string;
    readonly stats: readonly WidgetBudgetStatInterface[];
}
