import { useToday } from '../../@generic/hook/use-today.hook';
import { resolveBudgetFundDefaultDueDate } from '../utils/resolve-budget-fund-default-due-date.util';

import type { BudgetFundFormValues } from '../constant/budget-fund-form-schema.constant';
import type { BudgetWindowSourceInterface } from '../interface/budget-window-source.interface';

export const useBudgetFundDefaultValues = (budget: BudgetWindowSourceInterface): BudgetFundFormValues => ({
    name: '',
    categoryId: 0,
    targetAmount: 0,
    dueAtMs: resolveBudgetFundDefaultDueDate(budget, useToday()).getTime(),
    repeatEveryMonths: null,
    recurringSeriesId: null
});
