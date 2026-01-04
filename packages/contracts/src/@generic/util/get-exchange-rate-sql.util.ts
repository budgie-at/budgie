import { SQL, SQLWrapper, sql } from 'drizzle-orm';

import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';

export const getDirectExchangeRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`
        (
            SELECT ${ExchangeRateEntityTable.rate} * 1.0
            FROM ${ExchangeRateEntityTable}
            WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${instrumentIdRef}
              AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${defaultInstrumentId}
              AND ${ExchangeRateEntityTable.deletedAt} IS NULL
            ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
            LIMIT 1
        )
    `;

export const getInverseExchangeRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`
        (
            SELECT 1.0 / ${ExchangeRateEntityTable.rate}
            FROM ${ExchangeRateEntityTable}
            WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${defaultInstrumentId}
              AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${instrumentIdRef}
              AND ${ExchangeRateEntityTable.deletedAt} IS NULL
            ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
            LIMIT 1
        )
    `;
