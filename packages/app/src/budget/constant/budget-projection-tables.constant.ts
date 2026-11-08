import {
    BudgetCategoryLimitEntityTable,
    BudgetEntityTable,
    BudgetPeriodCategorySnapshotEntityTable,
    BudgetPeriodSnapshotEntityTable,
    BudgetSinkingFundEntityTable,
    ExchangeRateEntityTable,
    SyncRecordEntityTable,
    SyncOutboxEntityTable,
    HistoricalExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    RecurringSeriesEntityTable,
    RecurringSeriesTransactionEntityTable,
    SettingsEntityTable
} from '@budgie/contracts';

import { TRANSACTION_LIST_TABLES } from '../../transaction/constant/transaction-list-tables.constant';

export const BUDGET_PROJECTION_TABLES = [
    ...TRANSACTION_LIST_TABLES,
    SyncRecordEntityTable,
    SyncOutboxEntityTable,
    BudgetEntityTable,
    BudgetCategoryLimitEntityTable,
    BudgetPeriodSnapshotEntityTable,
    BudgetPeriodCategorySnapshotEntityTable,
    BudgetSinkingFundEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    RecurringSeriesEntityTable,
    RecurringSeriesTransactionEntityTable,
    SettingsEntityTable
];
