import { isDefined } from '@rnw-community/shared';

import { settingsRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetSettingsQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(settingsRepository.findSettings());

    if (!isDefined(updatedAt)) {
        return { isLoading: true, settings: null, updatedAt: null, error };
    }

    return { settings: data, isLoading: false, updatedAt, error };
};
