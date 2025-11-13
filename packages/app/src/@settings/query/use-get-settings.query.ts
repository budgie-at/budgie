import { SettingsEntityTable } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '../../drizzle/db/db';
import { DEFAULT_SETTINGS } from '../constants/default-settings.constant';

export const useGetSettingsQuery = () => {
    const { data, ...rest } = useLiveQuery(db.select().from(SettingsEntityTable).limit(1))
    const settings = data.at(0)

    return {
        settings: settings ?? DEFAULT_SETTINGS,
        ...rest
    }
}
