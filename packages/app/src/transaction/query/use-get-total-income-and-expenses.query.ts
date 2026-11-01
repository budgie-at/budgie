import { StatisticsRepository, TransactionFilterInterface, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

export const totalIncomeAndExpensesAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId]: readonly [TransactionFilterInterface, number]) =>
        statisticsRepository.getTotalIncomeAndExpenseQuery(filters, defaultInstrumentId)
);

export const useGetTotalIncomeAndExpensesQuery = (filters: TransactionFilterInterface) => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const result = useLiveAtomValue(totalIncomeAndExpensesAtom([filters, defaultInstrumentId]));
    const { income, expense } = AsyncResult.getOrElse(result, () => []).at(0) ?? { income: 0, expense: 0 };

    return { income: convertFromMicroUnits(income), expense: convertFromMicroUnits(expense), isLoading: AsyncResult.isInitial(result) };
};
