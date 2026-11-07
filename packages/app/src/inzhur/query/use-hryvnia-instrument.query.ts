import { CurrencyEnum, InstrumentEntityTable, InstrumentRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const hryvniaInstrumentAtom = databaseQueryAtom(
    [InstrumentEntityTable],
    Effect.flatMap(InstrumentRepository, instrumentRepository => instrumentRepository.findByCode(CurrencyEnum.UAH))
);

export const useHryvniaInstrumentQuery = () => AsyncResult.getOrElse(useLiveAtomValue(hryvniaInstrumentAtom), () => null) ?? null;
