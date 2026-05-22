import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useSearchCategoriesQuery = (query: string, includeDefault: boolean) => {
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findBySearchQuery(query, includeDefault), [query, includeDefault]);
    const { data: countData } = useLiveQuery(categoryRepository.count(includeDefault), [includeDefault]);
    const countRows = countData ?? [];

    if (!isDefined(updatedAt)) {
        return { isLoading: true, categories: null, total: 0, error, updatedAt: null };
    }

    return { categories: data ?? [], total: countRows.at(0)?.count ?? 0, isLoading: false, error, updatedAt };
};
