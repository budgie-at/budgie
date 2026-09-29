import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { settingsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useGetSettingsQuery = () => {
    const { data, updatedAt, error } = useDatabaseLiveQuery(settingsRepository.findSettings());
    const [settings, setSettings] = useState(data);

    if (settings !== data && JSON.stringify(settings) !== JSON.stringify(data)) {
        setSettings(data);
    }

    if (!isDefined(updatedAt)) {
        return { isLoading: true, settings: null, updatedAt: null, error };
    }

    return { settings, isLoading: false, updatedAt, error };
};
