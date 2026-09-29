import { SettingsCreateEntityInterface } from '@budgie/contracts';

import { settingsRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';

export const updateSettingsMutation = (input: Partial<SettingsCreateEntityInterface>) =>
    invalidateDatabaseLiveQuery(settingsRepository.update(input));
