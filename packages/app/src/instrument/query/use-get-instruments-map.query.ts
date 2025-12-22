import { InstrumentEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';

export const useGetInstrumentsMapQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(instrumentRepository.findAll(), []);

    if (!isDefined(updatedAt)) {
        return {
            instrumentsMap: new Map<number, InstrumentEntityInterface>(),
            isLoading: true,
            updatedAt: null,
            error: null
        };
    }

    const instrumentsMap = new Map<number, InstrumentEntityInterface>();
    for (const instrument of data) {
        instrumentsMap.set(instrument.id, instrument);
    }

    return {
        instrumentsMap,
        isLoading: false,
        updatedAt,
        error
    };
};
