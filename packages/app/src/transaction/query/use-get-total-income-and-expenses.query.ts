import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { DateRangeInterface } from '@budgie/contracts';

export const useGetTotalIncomeAndExpensesQuery = (range: DateRangeInterface) => {
    const { data } = useLiveQuery(transactionRepository.getTotalIncomeAndExpenseQuery(range), [range]);

    return data.at(0) ?? { income: 0, expense: 0 };
};
