import { DateRangeInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';

export const useGetExpenseByCategoryQuery = (range: DateRangeInterface) => {
    const { data } = useLiveQuery(transactionRepository.getExpenseByCategoryQuery(range), [range]);

    return { expenseByCategory: data };
};
