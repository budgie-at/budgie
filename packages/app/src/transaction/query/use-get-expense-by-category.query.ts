import { LanguageEnum, TransactionFilterInterface } from '@budgie/contracts';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetExpenseByCategoryQuery = (filters: TransactionFilterInterface, language: LanguageEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useDatabaseLiveQuery(statisticsRepository.getExpenseByCategoryQuery(filters, defaultInstrument.id, language), [
        filters,
        defaultInstrument.id,
        language
    ]);

    return { expenseByCategory: data };
};
