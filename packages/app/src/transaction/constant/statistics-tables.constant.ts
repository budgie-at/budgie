import { ExchangeRateEntityTable, HistoricalExchangeRateEntityTable } from '@budgie/contracts';

import { TRANSACTION_LIST_TABLES } from './transaction-list-tables.constant';

export const STATISTICS_TABLES = [...TRANSACTION_LIST_TABLES, ExchangeRateEntityTable, HistoricalExchangeRateEntityTable];
