import { infer } from 'zod';

import { SettingsEntitySchema } from '../schema/settings-entity.schema';

export interface SettingsEntityInterface extends infer<typeof SettingsEntitySchema> {}
