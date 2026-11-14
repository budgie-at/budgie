import {
    AccountEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { YieldService } from '@budgie/market';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { YieldQueryKeyInterface } from '@budgie/market';

export const yieldSummaryFamily = databaseQueryFamily(
    [
        TransactionEntityTable,
        TransactionEntryEntityTable,
        AccountEntityTable,
        InstrumentEntityTable,
        InstrumentDailyMarketPriceEntityTable,
        ExchangeRateEntityTable,
        HistoricalExchangeRateEntityTable
    ],
    YieldService,
    (service, key: YieldQueryKeyInterface) => service.summarize(key)
);
