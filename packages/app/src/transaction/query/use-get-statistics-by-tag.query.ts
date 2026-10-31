import { StatisticsRepository, TagEntityTable } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

import type { TransactionFilterInterface } from '@budgie/contracts';

export const statisticsByTagAtom = databaseQueryFamily(
    [...STATISTICS_TABLES, TagEntityTable],
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId]: readonly [TransactionFilterInterface, number]) =>
        Effect.all({
            incomeByTag: statisticsRepository.getIncomeByTagQuery(filters, defaultInstrumentId),
            expenseByTag: statisticsRepository.getExpenseByTagQuery(filters, defaultInstrumentId)
        })
);

export const useGetStatisticsByTagQuery = (filters: TransactionFilterInterface) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const result = useLiveAtomValue(statisticsByTagAtom([filters, defaultInstrument.id]));

    return { ...AsyncResult.getOrElse(result, () => ({ incomeByTag: [], expenseByTag: [] })), isLoading: AsyncResult.isInitial(result) };
};
