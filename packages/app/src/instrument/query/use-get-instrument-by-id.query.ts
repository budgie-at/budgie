import { instrumentRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetInstrumentByIdQuery = (id: number) => {
    const { data, updatedAt, ...rest } = useLiveQuery(instrumentRepository.findById(id), [id]);

    return {
        instrument: data,
        updatedAt,
        ...rest
    };
};
