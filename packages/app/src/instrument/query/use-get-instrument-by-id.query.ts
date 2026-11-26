import { InstrumentEntityTable, InstrumentRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const noInstrumentAtom = Atom.make(AsyncResult.success(null));

export const instrumentByIdAtom = databaseQueryFamily([InstrumentEntityTable], InstrumentRepository, (instrumentRepository, id: number) =>
    instrumentRepository.findById(id)
);

export const useGetInstrumentByIdQuery = (id: number) => {
    const shouldQuery = isPositiveNumber(id);
    const result = useLiveAtomValue(shouldQuery ? instrumentByIdAtom(id) : noInstrumentAtom);

    return { instrument: AsyncResult.getOrElse(result, () => null) ?? null, isLoading: AsyncResult.isInitial(result) };
};
