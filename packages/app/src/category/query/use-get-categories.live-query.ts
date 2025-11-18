import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';
import { categoryRepository } from '../../@generic/drizzle/db/db';

export const useGetCategoriesLiveQuery = (query = '') => {
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findBySearchQuery(query), [query]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, categories: [], error, updatedAt: null };
    }

    return { categories: data, isLoading: false, error, updatedAt };
};
