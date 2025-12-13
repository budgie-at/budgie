import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';

export const useSearchCategoriesQuery = (query: string, includeDefault: boolean) => {
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findBySearchQuery(query, includeDefault), [query, includeDefault]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, categories: null, error, updatedAt: null };
    }

    return { categories: data, isLoading: false, error, updatedAt };
};
