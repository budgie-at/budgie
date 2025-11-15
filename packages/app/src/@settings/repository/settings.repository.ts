import { SettingsRepository } from '@budgie/contracts';

import { db } from '../../drizzle/db/db';

export const settingsRepository = new SettingsRepository(db);
