import {
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    RecurringSeriesEntityTable,
    RecurringSeriesTransactionEntityTable,
    SettingsEntityTable
} from '@budgie/contracts';

import { TRANSACTION_LIST_TABLES } from '../../transaction/constant/transaction-list-tables.constant';

export const RECURRING_READ_TABLES = [
    ...TRANSACTION_LIST_TABLES,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    SettingsEntityTable,
    RecurringSeriesEntityTable,
    RecurringSeriesTransactionEntityTable
];
