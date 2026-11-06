import { SQL, SQLWrapper, sql } from 'drizzle-orm';

import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { HistoricalExchangeRateEntityTable } from '../../historical-exchange-rate/table/historical-exchange-rate-entity.table';
import { InstrumentDailyMarketPriceEntityTable } from '../../instrument-daily-market-price/table/instrument-daily-market-price-entity.table';

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
            ORDER BY ${HistoricalExchangeRateEntityTable.rateDate} DESC
            LIMIT 1
        )
    `;

const getStoredExchangeRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`COALESCE(
        ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
    )`;

const getMarketPriceExchangeRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL | SQLWrapper | number): SQL => {
    const quoteInstrumentIdSql = sql`latest.quote_instrument_id`;

    return sql`
        (
            SELECT latest.price * (
                CASE WHEN ${quoteInstrumentIdSql} = ${defaultInstrumentId} THEN 1.0
                ELSE ${getStoredExchangeRateSql(defaultInstrumentId, quoteInstrumentIdSql)} END
            )
            FROM (
                SELECT ${InstrumentDailyMarketPriceEntityTable.price} AS price, ${InstrumentDailyMarketPriceEntityTable.quoteInstrumentId} AS quote_instrument_id
                FROM ${InstrumentDailyMarketPriceEntityTable}
                WHERE ${InstrumentDailyMarketPriceEntityTable.instrumentId} = ${instrumentIdRef}
                  AND ${InstrumentDailyMarketPriceEntityTable.deletedAt} IS NULL
                ORDER BY ${InstrumentDailyMarketPriceEntityTable.priceDate} DESC
                LIMIT 1
            ) AS latest
        )
    `;
};

export const getExchangeRateWithHistoricalFallbackSql = (defaultInstrumentId: number, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`COALESCE(
        ${getStoredExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getMarketPriceExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
    )`;
