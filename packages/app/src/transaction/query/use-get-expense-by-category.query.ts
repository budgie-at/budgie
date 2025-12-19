import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { transactionRepository } from '../../@generic/drizzle/db/db';
import { DateRangeInterface } from '@budgie/contracts';

export const useGetExpenseByCategoryQuery = (range: DateRangeInterface) => {
    const { data } = useLiveQuery(transactionRepository.getExpenseByCategoryQuery(range), [range]);

    return { expenseByCategory: data };
};
