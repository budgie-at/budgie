import { isDefined } from '@rnw-community/shared';

import { settingsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useGetSettingsQuery = () => {
    const { data, updatedAt, error } = useDatabaseLiveQuery(settingsRepository.findSettings());

    if (!isDefined(updatedAt)) {
        return { isLoading: true, settings: null, updatedAt: null, error };
    }

    return { settings: data, isLoading: false, updatedAt, error };
};
