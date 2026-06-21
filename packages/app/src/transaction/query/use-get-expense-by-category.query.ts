import { LanguageEnum, TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseRefreshVersion } from '../../@generic/hook/use-database-refresh-version.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetExpenseByCategoryQuery = (filters: TransactionFilterInterface, language: LanguageEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const databaseRefreshVersion = useDatabaseRefreshVersion();
    const { data } = useLiveQuery(statisticsRepository.getExpenseByCategoryQuery(filters, defaultInstrument.id, language), [
        filters,
        defaultInstrument.id,
        language,
        databaseRefreshVersion
    ]);

    return { expenseByCategory: data };
};
