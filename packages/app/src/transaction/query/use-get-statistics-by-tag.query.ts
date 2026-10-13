import { StatisticsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

import type { TransactionFilterInterface } from '@budgie/contracts';

const statisticsByTagAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId]: readonly [TransactionFilterInterface, number]) =>
        Effect.all({
            incomeByTag: statisticsRepository.getIncomeByTagQuery(filters, defaultInstrumentId),
            expenseByTag: statisticsRepository.getExpenseByTagQuery(filters, defaultInstrumentId)
        })
);

export const useGetStatisticsByTagQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const result = useLiveAtomValue(statisticsByTagAtom([filters, defaultInstrument.id]));

    return AsyncResult.getOrElse(result, () => ({ incomeByTag: [], expenseByTag: [] }));
};
