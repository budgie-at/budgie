import {
    AccountEntityTable,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository
} from '@budgie/contracts';
import { calculateInstrumentPosition } from '@budgie/market';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const cryptoPositionEntriesAtom = databaseQueryFamily(
    [TransactionEntryEntityTable, TransactionEntityTable, AccountEntityTable, InstrumentEntityTable],
    TransactionEntryPositionRepository,
    (transactionEntryPositionRepository, [instrumentId, baseInstrumentId]: readonly [number, number]) =>
        transactionEntryPositionRepository.findInstrumentPositionEntries(instrumentId, baseInstrumentId)
);

export const useCryptoInstrumentPositionQuery = (instrumentId: number, baseInstrumentId: number) => {
    const result = useLiveAtomValue(cryptoPositionEntriesAtom([instrumentId, baseInstrumentId]));

    return calculateInstrumentPosition(AsyncResult.getOrElse(result, () => []));
};
