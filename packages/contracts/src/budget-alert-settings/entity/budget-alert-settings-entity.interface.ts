import { infer as zodInfer } from 'zod';

import { BudgetAlertSettingsEntitySchema } from '../schema/budget-alert-settings-entity.schema';

export interface BudgetAlertSettingsEntityInterface extends zodInfer<typeof BudgetAlertSettingsEntitySchema> {}
