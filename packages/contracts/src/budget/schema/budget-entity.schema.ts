import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BUDGET_TITLE_MAX_LENGTH } from '../constant/budget-title-max-length.constant';
import { BUDGET_TITLE_MIN_LENGTH } from '../constant/budget-title-min-length.constant';
import { BudgetPeriodEnum } from '../enum/budget-period.enum';
import { BudgetStatusEnum } from '../enum/budget-status.enum';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntitySchema = createSelectSchema(BudgetEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.min(BUDGET_TITLE_MIN_LENGTH).max(BUDGET_TITLE_MAX_LENGTH).describe('The budget title.'),
    period: zodEnum(BudgetPeriodEnum).describe('The budget period type.'),
    status: zodEnum(BudgetStatusEnum).describe('The budget status.'),
    startDay: schema => schema.min(1).max(31).describe('The start day of the budget period.'),
    instrumentId: schema => schema.positive().describe('The id of the budget currency instrument.'),
    isTemplate: schema => schema.describe('Indicates if the budget is a template.'),
    excludeTransfers: schema => schema.describe('Indicates if transfers are excluded from budget calculations.'),
    excludePending: schema => schema.describe('Indicates if pending transactions are excluded.'),
    alertThreshold80: schema => schema.describe('Enable alert at 80% threshold.'),
    alertThreshold100: schema => schema.describe('Enable alert at 100% threshold.')
});
