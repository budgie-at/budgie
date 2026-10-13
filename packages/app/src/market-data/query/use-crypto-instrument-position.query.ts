import {
    AccountEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository
} from '@budgie/contracts';
import { calculateCryptoPosition } from '@budgie/market';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const cryptoPositionEntriesAtom = databaseQueryFamily(
    [TransactionEntryEntityTable, TransactionEntityTable, AccountEntityTable],
    TransactionEntryPositionRepository,
    (transactionEntryPositionRepository, [instrumentId, baseInstrumentId]: readonly [number, number]) =>
        transactionEntryPositionRepository.findCryptoPositionEntries(instrumentId, baseInstrumentId)
);

export const useCryptoInstrumentPositionQuery = (instrumentId: number, baseInstrumentId: number) => {
    const result = useLiveAtomValue(cryptoPositionEntriesAtom([instrumentId, baseInstrumentId]));

    return calculateCryptoPosition(AsyncResult.getOrElse(result, () => []));
};
