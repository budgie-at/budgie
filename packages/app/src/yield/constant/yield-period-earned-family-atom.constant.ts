import {
    AccountEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { YieldService } from '@budgie/market';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const yieldPeriodEarnedFamily = databaseQueryFamily(
    [
        TransactionEntityTable,
        TransactionEntryEntityTable,
        AccountEntityTable,
        InstrumentEntityTable,
        ExchangeRateEntityTable,
        HistoricalExchangeRateEntityTable
    ],
    YieldService,
    (service, [fromDay, toDay, baseInstrumentId]: readonly [string, string, number]) =>
        service.earnedBetween(fromDay, toDay, baseInstrumentId)
);
