import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetAllocationInstanceEntityTable } from '../table/budget-allocation-instance-entity.table';

export const BudgetAllocationInstanceEntitySchema = createSelectSchema(BudgetAllocationInstanceEntityTable, {
    ...BaseEntityFields,
    budgetInstanceId: schema => schema.positive().describe('The id of the budget instance.'),
    budgetAllocationId: schema => schema.positive().describe('The id of the budget allocation.'),
    categoryId: schema => schema.positive().nullable().describe('The id of the category.'),
    planned: schema => schema.nonnegative().describe('Planned amount for this allocation in this period.'),
    actual: schema => schema.describe('Actual spending for this allocation in this period.'),
    forecast: schema => schema.describe('Forecasted spending for this allocation.'),
    rolloverIn: schema => schema.describe('Amount rolled over from previous period.'),
    rolloverOut: schema => schema.describe('Amount to roll over to next period.'),
    adjustment: schema => schema.describe('Manual adjustment amount (envelope moves).')
});
