import { isDefined } from '@rnw-community/shared';

import { SettingsEntityTable } from '../../schema';
import { SettingsAssociationEnum } from '../enum/settings-association.enum';

import type { DB } from '../../@generic/type/db.type';
import type * as schema from '../../schema';
import type { SettingsCreateEntityInterface } from '../entity/settings-create-entity-interface.type';
import type { SettingsEntityInterface } from '../entity/settings-entity-interface.type';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class SettingsRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    async update(input: Partial<SettingsCreateEntityInterface>, tx?: DB): Promise<SettingsEntityInterface> {
        const [settings] = await (tx ?? this.db).update(SettingsEntityTable).set(input).returning();

        return settings;
    }

    async getSettings(tx?: DB): Promise<SettingsEntityInterface> {
        const settings = await (tx ?? this.db).query.SettingsEntityTable.findFirst();

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
