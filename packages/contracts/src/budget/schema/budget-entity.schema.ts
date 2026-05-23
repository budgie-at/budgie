import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetPeriodEnum } from '../enum/budget-period.enum';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntitySchema = createSelectSchema(BudgetEntityTable, {
    ...BaseEntityFields,
    name: schema => schema.describe('The budget name.'),
    period: zodEnum(BudgetPeriodEnum).describe('The budget period type.'),
    periodStartDay: schema => schema.min(1).max(31).describe('The day of the month the period starts.'),
    useLastDayOfMonth: schema => schema.describe('Whether to anchor the period to the last day of each month.'),
    overallLimit: schema => schema.positive().describe('The overall spend limit for the period in micro-units.'),
    pushEnabled: schema => schema.describe('Whether push notifications are enabled for this budget.'),
    instrumentId: schema => schema.positive().describe('The instrument the budget is denominated in.')
});
