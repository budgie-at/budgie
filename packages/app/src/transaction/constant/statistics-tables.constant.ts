import { ExchangeRateEntityTable, HistoricalExchangeRateEntityTable } from '@budgie/contracts';

import { TRANSACTION_FILTER_TABLES } from './transaction-filter-tables.constant';

export const STATISTICS_TABLES = [...TRANSACTION_FILTER_TABLES, ExchangeRateEntityTable, HistoricalExchangeRateEntityTable];
