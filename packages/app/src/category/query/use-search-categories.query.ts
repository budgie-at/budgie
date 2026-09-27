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

    if (!isDefined(updatedAt)) {
        return { isLoading: true, categories: null, error, updatedAt: null };
    }

    return { categories: data, isLoading: false, error, updatedAt };
};
