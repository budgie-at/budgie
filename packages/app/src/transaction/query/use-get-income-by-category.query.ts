import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';

export const useGetIncomeByCategoryQuery = (filters: TransactionFilterInterface) => {
    const { data } = useLiveQuery(transactionRepository.getIncomeByCategoryQuery(filters), [filters]);

    return { incomeByCategory: data };
};
