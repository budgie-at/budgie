import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const useSearchOnlyCategoriesQuery = (search: string) => {
    const language = useSetting('language');

    return useDatabaseLiveQuery(categoryRepository.findBySearchQueryOrNone(search, true, language), [search, language]).data;
};
