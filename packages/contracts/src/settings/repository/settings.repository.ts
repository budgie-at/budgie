import { isDefined } from '@rnw-community/shared';

import * as schema from '../../schema';
import { SettingsAssociationEnum } from '../enum/settings-association.enum';

import type { SettingsEntityInterface } from '../entity/settings-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class SettingsRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    async getSettings(): Promise<SettingsEntityInterface> {
        const settings = await this.db.query.SettingsEntityTable.findFirst();

        if (!isDefined(settings)) {
            throw new Error('Settings not found');
        }

        return settings;
    }

    findSettings() {
        return this.db.query.SettingsEntityTable.findFirst({
            with: { [SettingsAssociationEnum.DEFAULT_INSTRUMENT]: true, [SettingsAssociationEnum.DEFAULT_ACCOUNT]: true }
        });
    }
}
