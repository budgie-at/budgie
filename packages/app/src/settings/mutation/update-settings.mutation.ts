import { SettingsCreateEntityInterface, SettingsEntityTable } from '@budgie/contracts';

import { db } from '../../@generic/drizzle/db/db';

export const updateSettingsMutation = async (input: Partial<SettingsCreateEntityInterface>) =>
    await db.update(SettingsEntityTable).set(input);
