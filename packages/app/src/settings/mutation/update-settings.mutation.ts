import { SettingsCreateEntityInterface } from '@budgie/contracts';

import { settingsRepository } from '../../@generic/drizzle/db/db';
import { databaseLiveQueryRevisionStore } from '../../@generic/drizzle/store/database-live-query-revision.store';

export const updateSettingsMutation = async (input: Partial<SettingsCreateEntityInterface>) => {
    const settings = await settingsRepository.update(input);
    databaseLiveQueryRevisionStore.notifyChanged();

    return settings;
};
