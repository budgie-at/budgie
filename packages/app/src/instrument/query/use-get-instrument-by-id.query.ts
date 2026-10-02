import { InstrumentEntityTable, InstrumentRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const instrumentByIdAtom = databaseQueryFamily([InstrumentEntityTable], InstrumentRepository, (instrumentRepository, id: number) =>
    instrumentRepository.findById(id)
);

export const useGetInstrumentByIdQuery = (id: number) => {
    const result = useLiveAtomValue(instrumentByIdAtom(id));

    return { instrument: AsyncResult.getOrElse(result, () => null) ?? null, isLoading: AsyncResult.isInitial(result) };
};
