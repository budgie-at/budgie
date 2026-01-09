import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetExpenseByCategoryQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(statisticsRepository.getExpenseByCategoryQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id
    ]);

    return { expenseByCategory: data };
};
