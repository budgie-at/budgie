import { infer as zodInfer } from 'zod';

import { BudgetIncomeExpectationCreateInputSchema } from '../schema/budget-income-expectation-create-input.schema';

export interface BudgetIncomeExpectationCreateInputInterface extends zodInfer<typeof BudgetIncomeExpectationCreateInputSchema> {}
