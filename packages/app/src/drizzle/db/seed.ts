import { SettingsEntityTable } from '@budgie/contracts';
import { DB } from './db';
import { isDefined } from '@rnw-community/shared';
import { DEFAULT_SETTINGS } from '../../@settings/constants/default-settings.constant';

export const runInitialSeed = async (db: DB): Promise<void> => {
    await db.transaction(async tx => {
        const [settings] = await tx.select().from(SettingsEntityTable).limit(1);

        if (isDefined(settings)) {
            return;
        }

        await tx.insert(SettingsEntityTable).values(DEFAULT_SETTINGS);
    });
};
