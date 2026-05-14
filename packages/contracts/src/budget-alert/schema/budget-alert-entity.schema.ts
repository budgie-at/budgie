import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';
import { BudgetAlertEntityTable } from '../table/budget-alert-entity.table';

export const BudgetAlertEntitySchema = createSelectSchema(BudgetAlertEntityTable, {
    ...BaseEntityFields,
    budgetId: schema => schema.positive().describe('The budget this alert belongs to.'),
    periodStart: schema => schema.describe('The start of the budget period this alert fires for.'),
    scope: zodEnum(BudgetAlertScopeEnum).describe('Whether this alert is for the overall budget or a specific category.'),
    categoryId: schema => schema.nullable().describe('The category id when scope is CATEGORY, null for OVERALL.'),
    threshold: schema => schema.positive().describe('The percentage threshold that triggered the alert (80 or 100).'),
    dismissedAt: schema => schema.nullable().describe('When the alert was dismissed, null if still active.')
});
