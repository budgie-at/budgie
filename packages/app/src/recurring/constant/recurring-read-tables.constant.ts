import {
    AccountEntityTable,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    RecurringSeriesEntityTable,
    RecurringSeriesTransactionEntityTable,
    SettingsEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';

export const RECURRING_READ_TABLES = [
    TransactionEntityTable,
    TransactionEntryEntityTable,
    AccountEntityTable,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    SettingsEntityTable,
    RecurringSeriesEntityTable,
    RecurringSeriesTransactionEntityTable
];
