import { SettingsCreateEntityInterface, SettingsEntityTable } from '@budgie/contracts';

import { db } from '../../@generic/drizzle/db/db';
import { databaseChangeService } from '../../@generic/service/database-change.service';

export const updateSettingsMutation = async (input: Partial<SettingsCreateEntityInterface>) => {
    const result = await db.update(SettingsEntityTable).set(input);

    databaseChangeService.markChanged();

    return result;
};
