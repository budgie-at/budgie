import { isPositiveNumber } from '@rnw-community/shared';

import { BudgetPaceStatusEnum } from '../../projection/enum/budget-pace-status.enum';
import { BudgetAlertKindEnum } from '../enum/budget-alert-kind.enum';
import { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';

import type { BudgetProjectionScopeInterface } from '../../projection/interface/budget-projection-scope.interface';
import type { BudgetProjectionInterface } from '../../projection/interface/budget-projection.interface';
import type { BudgetSpentInterface } from '../../spent/interface/budget-spent.interface';
import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetAlertBudgetInterface } from '../interface/budget-alert-budget.interface';
import type { BudgetAlertTriggerInterface } from '../interface/budget-alert-trigger.interface';

const BUDGET_ALERT_WARNING_THRESHOLD = 80;
const BUDGET_ALERT_LIMIT_THRESHOLD = 100;
const BUDGET_ALERT_THRESHOLDS = [BUDGET_ALERT_WARNING_THRESHOLD, BUDGET_ALERT_LIMIT_THRESHOLD] as const;

const toThresholdKind = (threshold: number): BudgetAlertKindEnum =>
    threshold === BUDGET_ALERT_LIMIT_THRESHOLD ? BudgetAlertKindEnum.LIMIT : BudgetAlertKindEnum.WARNING;

const crossesThreshold = (spent: number, limit: number, thresholdPercent: number): boolean =>
    isPositiveNumber(limit) && spent * 100 >= limit * thresholdPercent;

const computeOverallTriggers = (budget: BudgetAlertBudgetInterface, spent: BudgetSpentInterface): BudgetAlertTriggerInterface[] =>
    BUDGET_ALERT_THRESHOLDS.filter(threshold => crossesThreshold(spent.spentOverall, budget.overallLimit, threshold)).map(threshold => ({
        scope: BudgetAlertScopeEnum.OVERALL,
        categoryId: null,
        kind: toThresholdKind(threshold),
        threshold
    }));

const computeCategoryTriggers = (
    spent: BudgetSpentInterface,
    categoryLimits: readonly BudgetCategoryLimitInputInterface[]
): BudgetAlertTriggerInterface[] => {
    const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));

    return categoryLimits.flatMap(limit => {
        if (!isPositiveNumber(limit.limitAmount)) {
            return [];
        }

        const spentAmount = spentByCategoryMap.get(limit.categoryId) ?? 0;

        return BUDGET_ALERT_THRESHOLDS.filter(threshold => crossesThreshold(spentAmount, limit.limitAmount, threshold)).map(threshold => ({
            scope: BudgetAlertScopeEnum.CATEGORY,
            categoryId: limit.categoryId,
            kind: toThresholdKind(threshold),
            threshold
        }));
    });
};

const computeOtherTriggers = (
    budget: BudgetAlertBudgetInterface,
    spent: BudgetSpentInterface,
    categoryLimits: readonly BudgetCategoryLimitInputInterface[]
): BudgetAlertTriggerInterface[] => {
    if (!isPositiveNumber(budget.otherLimit)) {
        return [];
    }

    const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const limitedCategorySpent = categoryLimits.reduce((sum, limit) => sum + (spentByCategoryMap.get(limit.categoryId) ?? 0), 0);
    const otherSpent = Math.max(0, spent.spentOverall - limitedCategorySpent);

    return BUDGET_ALERT_THRESHOLDS.filter(threshold => crossesThreshold(otherSpent, budget.otherLimit, threshold)).map(threshold => ({
        scope: BudgetAlertScopeEnum.OTHER,
        categoryId: null,
        kind: toThresholdKind(threshold),
        threshold
    }));
};

export const computeBudgetAlertTriggers = (
    budget: BudgetAlertBudgetInterface,
    spent: BudgetSpentInterface,
    categoryLimits: readonly BudgetCategoryLimitInputInterface[]
): BudgetAlertTriggerInterface[] => [
    ...computeOverallTriggers(budget, spent),
    ...computeCategoryTriggers(spent, categoryLimits),
    ...computeOtherTriggers(budget, spent, categoryLimits)
];

const toPaceTrigger = (
    scope: BudgetProjectionScopeInterface,
    alertScope: BudgetAlertScopeEnum,
    categoryId: number | null
): BudgetAlertTriggerInterface[] =>
    isPositiveNumber(scope.limit) && scope.status === BudgetPaceStatusEnum.AHEAD
        ? [{ kind: BudgetAlertKindEnum.PACE, scope: alertScope, categoryId, threshold: BUDGET_ALERT_LIMIT_THRESHOLD }]
        : [];

export const computeBudgetPaceTriggers = (projection: BudgetProjectionInterface): BudgetAlertTriggerInterface[] => [
    ...toPaceTrigger(projection.overall, BudgetAlertScopeEnum.OVERALL, null),
    ...projection.categories.flatMap(category => toPaceTrigger(category, BudgetAlertScopeEnum.CATEGORY, category.categoryId)),
    ...toPaceTrigger(projection.other, BudgetAlertScopeEnum.OTHER, null)
];
