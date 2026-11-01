import {
    BudgetCategoryLimitEntityTable,
    BudgetEntityTable,
    BudgetPeriodCategorySnapshotEntityTable,
    BudgetPeriodSnapshotEntityTable,
    BudgetSinkingFundEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    RecurringSeriesEntityTable,
    SettingsEntityTable
} from '@budgie/contracts';

import { TRANSACTION_LIST_TABLES } from '../../transaction/constant/transaction-list-tables.constant';

export const BUDGET_PROJECTION_TABLES = [
    ...TRANSACTION_LIST_TABLES,
    BudgetEntityTable,
    BudgetCategoryLimitEntityTable,
    BudgetPeriodSnapshotEntityTable,
    BudgetPeriodCategorySnapshotEntityTable,
    BudgetSinkingFundEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    RecurringSeriesEntityTable,
    SettingsEntityTable
];
