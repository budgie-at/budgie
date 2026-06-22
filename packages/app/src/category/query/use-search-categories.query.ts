import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const useSearchCategoriesQuery = (query: string, includeDefault: boolean) => {
    const language = useSetting('language');
    const { data, error, updatedAt } = useDatabaseLiveQuery(categoryRepository.findBySearchQuery(query, includeDefault, language), [
        query,
        includeDefault,
        language
    ]);
    const { data: countData } = useDatabaseLiveQuery(categoryRepository.count(includeDefault), [includeDefault]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, categories: null, total: 0, error, updatedAt: null };
    }

    return { categories: data, total: countData.at(0)?.count ?? 0, isLoading: false, error, updatedAt };
};
