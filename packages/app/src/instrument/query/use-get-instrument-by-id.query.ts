import { isDefined } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useGetInstrumentByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useDatabaseLiveQuery(instrumentRepository.findById(id), [id]);

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
