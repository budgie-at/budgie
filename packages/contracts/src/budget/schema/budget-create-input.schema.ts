import { array } from 'zod';

import { BudgetCategoryLimitCreateInputSchema } from '../../budget-category-limit/schema/budget-category-limit-create-input.schema';
import { BudgetIncomeExpectationCreateInputSchema } from '../../budget-income-expectation/schema/budget-income-expectation-create-input.schema';

import { BudgetCreateEntitySchema } from './budget-create-entity.schema';

export const BudgetCreateInputSchema = BudgetCreateEntitySchema.omit({ rolloverAmount: true }).extend({
    categoryLimits: array(BudgetCategoryLimitCreateInputSchema),
    incomeExpectations: array(BudgetIncomeExpectationCreateInputSchema)
});
