import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';

export const useSearchCategoriesQuery = (query: string, includeDefault: boolean) => {
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findBySearchQuery(query, includeDefault), [query, includeDefault]);
    const { data: countData } = useLiveQuery(categoryRepository.count(includeDefault), [includeDefault]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, categories: null, total: 0, error, updatedAt: null };
    }

    return { categories: data, total: countData.at(0)?.count ?? 0, isLoading: false, error, updatedAt };
};
