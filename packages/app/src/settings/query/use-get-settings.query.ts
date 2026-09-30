import { AccountEntityTable, InstrumentEntityTable, SettingsEntityTable, SettingsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const settingsAtom = databaseQueryAtom(
    [SettingsEntityTable, InstrumentEntityTable, AccountEntityTable],
    Effect.flatMap(SettingsRepository, settingsRepository => settingsRepository.findSettings())
);

export const useGetSettingsQuery = () => {
    const result = useLiveAtomValue(settingsAtom);
    const data = AsyncResult.getOrElse(result, () => null);
    const [settings, setSettings] = useState(data);

    if (settings !== data && JSON.stringify(settings) !== JSON.stringify(data)) {
        setSettings(data);
    }

    if (AsyncResult.isInitial(result)) {
        return { isLoading: true, settings: null };
    }

    return { settings, isLoading: false };
};
