import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetPeriodEnum } from '../../budget/enum/budget-period.enum';
import { BudgetTemplateEntityTable } from '../table/budget-template-entity.table';

export const BudgetTemplateEntitySchema = createSelectSchema(BudgetTemplateEntityTable, {
    ...BaseEntityFields,
    period: zodEnum(BudgetPeriodEnum)
});
