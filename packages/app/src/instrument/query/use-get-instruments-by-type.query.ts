import { InstrumentTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';

export const useGetInstrumentsByTypeQuery = (type: InstrumentTypeEnum) => {
    const { data, updatedAt, error } = useLiveQuery(instrumentRepository.findByType(type), [type]);

    if (!isDefined(updatedAt)) {
        return {
            instruments: [],
            isLoading: true,
            updatedAt: null,
            error: null
        };
    }

    return {
        instruments: data,
        isLoading: false,
        updatedAt,
        error
    };
};
