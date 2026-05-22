import { InstrumentTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

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
        instruments: data ?? [],
        isLoading: false,
        updatedAt,
        error
    };
};
