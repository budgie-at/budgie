import { convertToMicroUnits } from '@budgie/contracts';
import { startOfDay } from 'date-fns/startOfDay';

import type { BudgetFundFormValues } from '../constant/budget-fund-form-schema.constant';
import type { BudgetSinkingFundCreateEntityInterface } from '@budgie/contracts';

export const buildBudgetFundPayload = (values: BudgetFundFormValues, budgetId: number): BudgetSinkingFundCreateEntityInterface => ({
    budgetId,
    name: values.name,
    categoryId: values.categoryId,
    targetAmount: convertToMicroUnits(values.targetAmount),
    dueAt: startOfDay(new Date(values.dueAtMs)),
    repeatEveryMonths: values.repeatEveryMonths,
    recurringSeriesId: values.recurringSeriesId
});
