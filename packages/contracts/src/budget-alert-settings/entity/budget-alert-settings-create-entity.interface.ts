import type { BudgetAlertSettingsCreateEntitySchema } from '../schema/budget-alert-settings-create-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetAlertSettingsCreateEntityInterface extends zodInfer<typeof BudgetAlertSettingsCreateEntitySchema> {}
