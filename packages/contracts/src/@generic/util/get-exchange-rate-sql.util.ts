import { SQL, SQLWrapper, sql } from 'drizzle-orm';

import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { HistoricalExchangeRateEntityTable } from '../../historical-exchange-rate/table/historical-exchange-rate-entity.table';

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

export const getHistoricalExchangeRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`
        (
            SELECT ${HistoricalExchangeRateEntityTable.rate} * 1.0
            FROM ${HistoricalExchangeRateEntityTable}
            WHERE ${HistoricalExchangeRateEntityTable.sourceInstrumentId} = ${instrumentIdRef}
              AND ${HistoricalExchangeRateEntityTable.targetInstrumentId} = ${defaultInstrumentId}
              AND ${HistoricalExchangeRateEntityTable.deletedAt} IS NULL
            ORDER BY ${HistoricalExchangeRateEntityTable.rateDate} DESC
            LIMIT 1
        )
    `;

export const getInverseHistoricalExchangeRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`
        (
            SELECT 1.0 / ${HistoricalExchangeRateEntityTable.rate}
            FROM ${HistoricalExchangeRateEntityTable}
            WHERE ${HistoricalExchangeRateEntityTable.sourceInstrumentId} = ${defaultInstrumentId}
              AND ${HistoricalExchangeRateEntityTable.targetInstrumentId} = ${instrumentIdRef}
              AND ${HistoricalExchangeRateEntityTable.deletedAt} IS NULL
            ORDER BY ${HistoricalExchangeRateEntityTable.rateDate} DESC
            LIMIT 1
        )
    `;

export const getExchangeRateWithHistoricalFallbackSql = (defaultInstrumentId: number, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`COALESCE(
        ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
    )`;
