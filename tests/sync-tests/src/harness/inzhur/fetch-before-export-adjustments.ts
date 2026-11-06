import * as Effect from 'effect/Effect';

import { fetchInzhurLedger } from './fetch-inzhur-ledger';

export const fetchBeforeExportAdjustments = Effect.map(fetchInzhurLedger(), ledger =>
    ledger.filter(transaction => transaction.externalId === 'inzhur:before-export')
);
