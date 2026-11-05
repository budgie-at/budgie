import { ExchangeRateEntityTable } from '@budgie/contracts';
import { sql } from 'drizzle-orm';

import type { SQLWrapper } from 'drizzle-orm';

export const buildRateToDefault = (instrumentId: SQLWrapper, defaultInstrumentId: number | null) =>
    sql<number>`COALESCE(
        (SELECT ${ExchangeRateEntityTable.rate} * 1.0 FROM ${ExchangeRateEntityTable}
         WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${instrumentId}
           AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${defaultInstrumentId}
           AND ${ExchangeRateEntityTable.deletedAt} IS NULL
         ORDER BY ${ExchangeRateEntityTable.createdAt} DESC LIMIT 1),
        (SELECT 1.0 / ${ExchangeRateEntityTable.rate} FROM ${ExchangeRateEntityTable}
         WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${defaultInstrumentId}
           AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${instrumentId}
           AND ${ExchangeRateEntityTable.deletedAt} IS NULL
         ORDER BY ${ExchangeRateEntityTable.createdAt} DESC LIMIT 1),
        1.0
    )`;
