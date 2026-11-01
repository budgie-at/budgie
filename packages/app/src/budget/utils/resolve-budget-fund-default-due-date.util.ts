import { getInclusiveEnd } from '@budgie/budget';

import { resolveBudgetWindow } from './resolve-budget-window.util';

import type { BudgetWindowSourceInterface } from '../interface/budget-window-source.interface';

export const resolveBudgetFundDefaultDueDate = (budget: BudgetWindowSourceInterface, today: Date): Date =>
    getInclusiveEnd(resolveBudgetWindow(budget, resolveBudgetWindow(budget, today).nextPeriodStart).nextPeriodStart);
