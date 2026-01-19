import { createSelectSchema } from 'drizzle-zod';

import { BudgetIncomeExpectationEntityTable } from '../table/budget-income-expectation-entity.table';

export const BudgetIncomeExpectationEntitySchema = createSelectSchema(BudgetIncomeExpectationEntityTable);
