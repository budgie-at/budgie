import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

import type { CategoryEntityInterface } from '@budgie/contracts';

const EMPTY_CATEGORIES: CategoryEntityInterface[] = [];

export const useAllCategoriesQuery = () => {
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findAll());

    if (!isDefined(data)) {
        return { isLoading: true, categories: EMPTY_CATEGORIES, updatedAt: null, error };
    }

    return { categories: data, isLoading: false, updatedAt, error };
};
