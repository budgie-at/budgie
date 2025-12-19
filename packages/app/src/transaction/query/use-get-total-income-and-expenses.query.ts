import { DateRangeInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';

export const useGetTotalIncomeAndExpensesQuery = (range: DateRangeInterface) => {
    const { data } = useLiveQuery(transactionRepository.getTotalIncomeAndExpenseQuery(range), [range]);

    return data.at(0) ?? { income: 0, expense: 0 };
};
