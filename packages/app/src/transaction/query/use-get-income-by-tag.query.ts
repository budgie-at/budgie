import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseRefreshVersion } from '../../@generic/hook/use-database-refresh-version.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetIncomeByTagQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const databaseRefreshVersion = useDatabaseRefreshVersion();
    const { data } = useLiveQuery(statisticsRepository.getIncomeByTagQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id,
        databaseRefreshVersion
    ]);

    return { incomeByTag: data };
};
