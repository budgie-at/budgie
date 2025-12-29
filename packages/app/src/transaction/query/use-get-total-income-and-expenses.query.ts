import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

export const useGetTotalIncomeAndExpensesQuery = (filters: TransactionFilterInterface) => {
    const { data } = useLiveQuery(transactionRepository.getTotalIncomeAndExpenseQuery(filters), [filters]);
    const { income, expense } = data.at(0) ?? { income: 0, expense: 0 };

    return { income: convertFromMicroUnits(income), expense: convertFromMicroUnits(expense) };
};
