import * as Effect from 'effect/Effect';

import { fetchInzhurLedger } from './fetch-inzhur-ledger';

export const fetchInzhurOperationsLedger = Effect.map(fetchInzhurLedger(), ledger =>
    ledger.filter(transaction => transaction.externalId?.startsWith('inzhur:op:'))
);
