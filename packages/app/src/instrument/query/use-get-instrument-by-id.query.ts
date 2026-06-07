import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';

export const useGetInstrumentByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useLiveQuery(instrumentRepository.findById(id), [id]);

    if (!isDefined(data)) {
        return { isLoading: !isDefined(updatedAt), instrument: null, updatedAt, error };
    }

    return {
        instrument: data,
        isLoading: false,
        updatedAt,
        error
    };
};
