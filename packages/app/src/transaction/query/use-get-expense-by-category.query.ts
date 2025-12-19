import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';

export const useGetExpenseByCategoryQuery = (filters: TransactionFilterInterface) => {
    const { data } = useLiveQuery(transactionRepository.getExpenseByCategoryQuery(filters), [filters]);

    return { expenseByCategory: data };
};
