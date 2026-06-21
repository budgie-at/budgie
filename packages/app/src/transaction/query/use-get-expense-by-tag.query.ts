import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseRefreshVersion } from '../../@generic/hook/use-database-refresh-version.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetExpenseByTagQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const databaseRefreshVersion = useDatabaseRefreshVersion();
    const { data } = useLiveQuery(statisticsRepository.getExpenseByTagQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id,
        databaseRefreshVersion
    ]);

    return { expenseByTag: data };
};
