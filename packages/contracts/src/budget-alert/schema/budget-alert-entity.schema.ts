import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetAlertSeverityEnum } from '../enum/budget-alert-severity.enum';
import { BudgetAlertTypeEnum } from '../enum/budget-alert-type.enum';
import { BudgetAlertEntityTable } from '../table/budget-alert-entity.table';

export const BudgetAlertEntitySchema = createSelectSchema(BudgetAlertEntityTable, {
    ...BaseEntityFields,
    type: zodEnum(BudgetAlertTypeEnum),
    severity: zodEnum(BudgetAlertSeverityEnum)
});
