import { infer as zodInfer } from 'zod';

import { BudgetIncomeExpectationEntitySchema } from '../schema/budget-income-expectation-entity.schema';

export interface BudgetIncomeExpectationEntityInterface extends zodInfer<typeof BudgetIncomeExpectationEntitySchema> {}
