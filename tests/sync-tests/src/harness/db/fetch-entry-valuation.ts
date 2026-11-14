import * as Effect from 'effect/Effect';

import type { DB } from '@budgie/contracts';

export const fetchEntryValuation = (database: DB, entryId: number) =>
    database.$client
        .unsafe<{ readonly baseInstrumentId: number | null; readonly baseExchangeRate: number | null; readonly baseAmount: number | null }>(
            'SELECT base_instrument_id AS baseInstrumentId, base_exchange_rate AS baseExchangeRate, base_amount AS baseAmount FROM transaction_entries WHERE id = ?',
            [entryId]
        )
        .pipe(Effect.map(([row]) => ({ ...row })));
