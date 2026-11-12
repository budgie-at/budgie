import {
    AccountEntityTable,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository
} from '@budgie/contracts';
import { calculateInstrumentPosition } from '@budgie/market';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const instrumentPositionEntriesAtom = databaseQueryFamily(
    [TransactionEntryEntityTable, TransactionEntityTable, AccountEntityTable, InstrumentEntityTable],
    TransactionEntryPositionRepository,
    (transactionEntryPositionRepository, [instrumentIds, baseInstrumentId]: readonly [readonly number[], number]) =>
        Effect.forEach(instrumentIds, instrumentId =>
            transactionEntryPositionRepository.findInstrumentPositionEntries(instrumentId, baseInstrumentId)
        )
);

export const useInstrumentPositionsQuery = (instrumentIds: readonly number[], baseInstrumentId: number) =>
    AsyncResult.getOrElse(useLiveAtomValue(instrumentPositionEntriesAtom([instrumentIds, baseInstrumentId])), () => []).map(entries =>
        calculateInstrumentPosition(entries)
    );
