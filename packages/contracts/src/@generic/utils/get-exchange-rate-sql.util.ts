import { SQL, SQLWrapper, sql } from 'drizzle-orm';

import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { HistoricalExchangeRateEntityTable } from '../../historical-exchange-rate/table/historical-exchange-rate-entity.table';
import { InstrumentDailyMarketPriceEntityTable } from '../../instrument-daily-market-price/table/instrument-daily-market-price-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { CurrencyEnum } from '../enum/currency.enum';

export const getDirectExchangeRateSql = (defaultInstrumentId: number | SQL, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
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

export const getInverseExchangeRateSql = (defaultInstrumentId: number | SQL, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
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

export const getHistoricalExchangeRateSql = (defaultInstrumentId: number | SQL, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
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

export const getInverseHistoricalExchangeRateSql = (defaultInstrumentId: number | SQL, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
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

const getStoredExchangeRateSql = (defaultInstrumentId: number | SQL, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`COALESCE(
        ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
        ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
    )`;

const getMarketPriceExchangeRateSql = (defaultInstrumentId: number | SQL, instrumentIdRef: SQL | SQLWrapper | number): SQL => {
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

const getFiatBridgeSql = (defaultInstrumentId: number | SQL, instrumentIdRef: SQL): SQL => {
    const euroInstrumentId = sql`(SELECT id FROM instruments WHERE code = ${CurrencyEnum.EUR} LIMIT 1)`;

    return sql`(
        CASE WHEN ${instrumentIdRef} = ${euroInstrumentId} THEN 1.0 ELSE ${getHistoricalExchangeRateSql(euroInstrumentId, instrumentIdRef)} END
        / CASE WHEN ${defaultInstrumentId} = ${euroInstrumentId} THEN 1.0 ELSE ${getHistoricalExchangeRateSql(euroInstrumentId, defaultInstrumentId)} END
    )`;
};

const getQuotedExchangeRateSql = (defaultInstrumentId: number | SQL, instrumentIdRef: SQL | SQLWrapper | number): SQL =>
    sql`(
        SELECT COALESCE(
            ${getStoredExchangeRateSql(sql`quoted_instrument.quote_instrument_id`, instrumentIdRef)},
            ${getMarketPriceExchangeRateSql(sql`quoted_instrument.quote_instrument_id`, instrumentIdRef)}
        ) * CASE WHEN quoted_instrument.quote_instrument_id = ${defaultInstrumentId} THEN 1.0
            ELSE COALESCE(${getStoredExchangeRateSql(defaultInstrumentId, sql`quoted_instrument.quote_instrument_id`)}, ${getFiatBridgeSql(defaultInstrumentId, sql`quoted_instrument.quote_instrument_id`)}) END
        FROM ${InstrumentEntityTable} AS quoted_instrument
        WHERE quoted_instrument.id = ${instrumentIdRef}
          AND quoted_instrument.quote_instrument_id IS NOT NULL
    )`;

export const getExchangeRateWithHistoricalFallbackSql = (
    defaultInstrumentId: number | SQL,
    instrumentIdRef: SQL | SQLWrapper | number
): SQL =>
    sql`CASE WHEN (SELECT quote_instrument_id FROM ${InstrumentEntityTable} WHERE ${InstrumentEntityTable.id} = ${instrumentIdRef}) IS NOT NULL
        THEN ${getQuotedExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
        ELSE COALESCE(${getStoredExchangeRateSql(defaultInstrumentId, instrumentIdRef)}, ${getMarketPriceExchangeRateSql(defaultInstrumentId, instrumentIdRef)})
    END`;
