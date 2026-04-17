import { z } from 'zod';

import { SettingsEntitySchema } from '../schema/settings-entity.schema';

export type SettingsEntityInterface = z.infer<typeof SettingsEntitySchema>;
