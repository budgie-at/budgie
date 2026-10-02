import { InstrumentEntityTable, InstrumentRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { InstrumentTypeEnum } from '@budgie/contracts';

const instrumentsByTypeAtom = databaseQueryFamily(
    [InstrumentEntityTable],
    InstrumentRepository,
    (instrumentRepository, type: InstrumentTypeEnum) => instrumentRepository.findByType(type)
);

export const useGetInstrumentsByTypeQuery = (type: InstrumentTypeEnum) => {
    const result = useLiveAtomValue(instrumentsByTypeAtom(type));

    return { instruments: AsyncResult.getOrElse(result, () => []), isLoading: AsyncResult.isInitial(result) };
};
