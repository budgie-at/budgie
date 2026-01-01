import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetInstanceStatusEnum } from '../enum/budget-instance-status.enum';
import { BudgetInstanceEntityTable } from '../table/budget-instance-entity.table';

export const BudgetInstanceEntitySchema = createSelectSchema(BudgetInstanceEntityTable, {
    ...BaseEntityFields,
    budgetId: schema => schema.positive().describe('The id of the budget.'),
    status: zodEnum(BudgetInstanceStatusEnum).describe('The instance status.'),
    startDate: schema => schema.describe('The start date of the budget period.'),
    endDate: schema => schema.describe('The end date of the budget period.'),
    totalPlanned: schema => schema.nonnegative().describe('Total planned amount for the period.'),
    totalActual: schema => schema.describe('Total actual spending for the period.'),
    totalForecast: schema => schema.describe('Total forecasted spending for the period.'),
    exchangeRate: schema => schema.positive().describe('Exchange rate used for the period.'),
    incomeActual: schema => schema.nonnegative().describe('Actual income received in the period.')
});
