import { infer } from 'zod';

import { SettingsCreateEntitySchema } from '../schema/settings-create-entity.schema';

export interface SettingsCreateEntityInterface extends infer<typeof SettingsCreateEntitySchema> {}
