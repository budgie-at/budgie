import { StatisticsRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

import type { TransactionFilterInterface } from '@budgie/contracts';

const incomeByTagAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId]: readonly [TransactionFilterInterface, number]) =>
        statisticsRepository.getIncomeByTagQuery(filters, defaultInstrumentId)
);

const expenseByTagAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId]: readonly [TransactionFilterInterface, number]) =>
        statisticsRepository.getExpenseByTagQuery(filters, defaultInstrumentId)
);

export const useGetStatisticsByTagQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const incomeResult = useLiveAtomValue(incomeByTagAtom([filters, defaultInstrument.id]));
    const expenseResult = useLiveAtomValue(expenseByTagAtom([filters, defaultInstrument.id]));

    return {
        incomeByTag: AsyncResult.getOrElse(incomeResult, () => []),
        expenseByTag: AsyncResult.getOrElse(expenseResult, () => [])
    };
};
