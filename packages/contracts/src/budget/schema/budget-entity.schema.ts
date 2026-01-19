import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetPeriodEnum } from '../enum/budget-period.enum';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntitySchema = createSelectSchema(BudgetEntityTable, {
    ...BaseEntityFields,
    period: zodEnum(BudgetPeriodEnum)
});
