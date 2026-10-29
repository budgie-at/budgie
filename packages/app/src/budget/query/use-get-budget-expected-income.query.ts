import {
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    RecurringSeriesEntityTable,
    SettingsEntityTable
} from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../../transaction/constant/transaction-list-tables.constant';
import { BudgetProjectionService } from '../service/budget-projection.service';
import { fromBudgetProjectionKey } from '../utils/from-budget-projection-key.util';

import type { BudgetProjectionKeyInterface } from '../interface/budget-projection-key.interface';

export const budgetExpectedIncomeAtom = databaseQueryFamily(
    [
        ...TRANSACTION_LIST_TABLES,
        ExchangeRateEntityTable,
        HistoricalExchangeRateEntityTable,
        SettingsEntityTable,
        RecurringSeriesEntityTable
    ],
    BudgetProjectionService,
    (budgetProjectionService, key: BudgetProjectionKeyInterface) =>
        budgetProjectionService.expectedIncome(fromBudgetProjectionKey(key), new Date(key.dayStart))
);

export const useGetBudgetExpectedIncomeQuery = (key: BudgetProjectionKeyInterface): number | null => {
    const today = useToday();
    const result = useLiveAtomValue(budgetExpectedIncomeAtom({ ...key, dayStart: new Date(today).setHours(0, 0, 0, 0) }));

    return AsyncResult.isSuccess(result) ? result.value : null;
};
