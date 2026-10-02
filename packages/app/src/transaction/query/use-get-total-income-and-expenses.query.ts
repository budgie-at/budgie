import { StatisticsRepository, TransactionFilterInterface } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

const totalIncomeAndExpensesAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId]: readonly [TransactionFilterInterface, number]) =>
        statisticsRepository.getTotalIncomeAndExpenseQuery(filters, defaultInstrumentId)
);

export const useGetTotalIncomeAndExpensesQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const result = useLiveAtomValue(totalIncomeAndExpensesAtom([filters, defaultInstrument.id]));
    const { income, expense } = AsyncResult.getOrElse(result, () => []).at(0) ?? { income: 0, expense: 0 };

    return { income: convertFromMicroUnits(income), expense: convertFromMicroUnits(expense) };
};
