import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

export const BudgetCategoryLimitEntitySchema = createSelectSchema(BudgetCategoryLimitEntityTable, {
    ...BaseEntityFields,
    budgetId: schema => schema.positive().describe('The budget id this limit belongs to.'),
    categoryId: schema => schema.positive().describe('The category id this limit applies to.'),
    limitAmount: schema => schema.positive().describe('The limit amount for the category in micro-units.')
});
