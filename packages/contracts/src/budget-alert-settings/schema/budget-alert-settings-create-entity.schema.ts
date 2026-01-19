import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BudgetAlertSettingsEntitySchema } from './budget-alert-settings-entity.schema';

export const BudgetAlertSettingsCreateEntitySchema = convertToCreateEntitySchema(BudgetAlertSettingsEntitySchema);
