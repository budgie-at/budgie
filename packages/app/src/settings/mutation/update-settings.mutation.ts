import { SettingsCreateEntityInterface } from '@budgie/contracts';

import { settingsRepository } from '../../@generic/drizzle/db/db';
import { databaseRefreshService } from '../../@generic/service/database-refresh.service';

export const updateSettingsMutation = async (input: Partial<SettingsCreateEntityInterface>) => {
    const settings = await settingsRepository.update(input);
    databaseRefreshService.notifyChanged();

    return settings;
};
