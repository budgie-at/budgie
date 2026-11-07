import {
    AccountBalanceEntityTable,
    AccountEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable,
    SyncEntityTable,
    SyncOutboxEntityTable,
    SyncRecordEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';

export const ACCOUNT_BALANCE_TABLES = [
    AccountEntityTable,
    AccountBalanceEntityTable,
    SyncEntityTable,
    TransactionEntryEntityTable,
    TransactionEntityTable
];

export const ACCOUNT_CONVERTED_BALANCE_TABLES = [
    ...ACCOUNT_BALANCE_TABLES,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    SyncRecordEntityTable,
    SyncOutboxEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable
];
