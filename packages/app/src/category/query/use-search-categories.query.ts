import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { toFtsQuery } from '../../@generic/utils/to-fts-query.util';

export const useSearchCategoriesQuery = (query: string, includeDefault: boolean) => {
    const ftsQuery = toFtsQuery(query);
    const searchArg = ftsQuery ?? '';
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findBySearchQuery(searchArg, includeDefault), [
        searchArg,
        includeDefault
    ]);
    const { data: countData } = useLiveQuery(categoryRepository.count(includeDefault), [includeDefault]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, categories: null, total: 0, error, updatedAt: null };
    }

    return { categories: data, total: countData.at(0)?.count ?? 0, isLoading: false, error, updatedAt };
};
