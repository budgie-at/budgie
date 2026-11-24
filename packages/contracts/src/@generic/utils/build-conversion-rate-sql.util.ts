import { sql } from 'drizzle-orm';

import {
    getDirectExchangeRateSql,
    getHistoricalExchangeRateSql,
    getInverseExchangeRateSql,
    getInverseHistoricalExchangeRateSql
} from './get-exchange-rate-sql.util';

import type { SQL } from 'drizzle-orm';

export const buildConversionRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL) =>
    sql`CASE WHEN ${instrumentIdRef} = ${defaultInstrumentId} THEN 1.0 ELSE COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
        ) END`;
