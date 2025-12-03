import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { instrumentRepository } from '../../@generic/drizzle/db/db';

export const useGetInstrumentByIdQuery = (id: number) => {
    const { data, updatedAt, ...rest } = useLiveQuery(instrumentRepository.findById(id), [id]);

    return {
        instrument: data,
        updatedAt,
        ...rest
    };
};
