import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';

export const useGetTotalIncomeAndExpensesQuery = (filters: TransactionFilterInterface) => {
    const { data } = useLiveQuery(transactionRepository.getTotalIncomeAndExpenseQuery(filters), [filters]);

    return data.at(0) ?? { income: BigInt(0), expense: BigInt(0) };
};
