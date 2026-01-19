import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { BudgetAlertSettingsEntityTable } from '../table/budget-alert-settings-entity.table';

export const BudgetAlertSettingsEntitySchema = createSelectSchema(BudgetAlertSettingsEntityTable, {
    ...BaseEntityFields
});
