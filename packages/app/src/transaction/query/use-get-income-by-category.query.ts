import { DateRangeInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';

export const useGetIncomeByCategoryQuery = (range: DateRangeInterface) => {
    const { data } = useLiveQuery(transactionRepository.getIncomeByCategoryQuery(range), [range]);

    return { incomeByCategory: data };
};
