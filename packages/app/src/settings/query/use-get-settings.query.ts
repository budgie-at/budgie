import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { settingsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseChangeKey } from '../../@generic/hook/use-database-change-key.hook';

export const useGetSettingsQuery = () => {
    const databaseChangeKey = useDatabaseChangeKey();
    const { data, updatedAt, error } = useLiveQuery(settingsRepository.findSettings(), [databaseChangeKey]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, settings: null, updatedAt: null, error };
    }

    return { settings: data, isLoading: false, updatedAt, error };
};
