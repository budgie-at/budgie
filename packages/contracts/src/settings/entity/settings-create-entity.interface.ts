import { z } from 'zod';

import { SettingsCreateEntitySchema } from '../schema/settings-create-entity.schema';

export type SettingsCreateEntityInterface = z.infer<typeof SettingsCreateEntitySchema>;
