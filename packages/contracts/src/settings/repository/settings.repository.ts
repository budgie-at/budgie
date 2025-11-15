import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import type { SettingsEntityInterface } from '../entity/settings-entity.interface';
import { SettingsEntityTable } from '../table/settings-entity.table';

export class SettingsRepository {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(private db: ExpoSQLiteDatabase<any>) {}

    async getSettings(): Promise<SettingsEntityInterface | null> {
        try {
            const [settings] = await this.db.select().from(SettingsEntityTable).limit(1);

            return settings ?? null;
        } catch {
            return null;
        }
    }

    async getDefaultInstrumentId(): Promise<number | null> {
        const settings = await this.getSettings();

        return settings?.defaultInstrumentId ?? null;
    }
}
