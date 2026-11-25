import { sql } from 'drizzle-orm';

import {
    getDirectExchangeRateSql,
    getHistoricalExchangeRateSql,
    getInverseExchangeRateSql,
    getInverseHistoricalExchangeRateSql
} from './get-exchange-rate-sql.util';

import type { SQL } from 'drizzle-orm';

export const buildConversionRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL) =>
    sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
        )`;
