import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';

import type { CategoryEntityInterface } from '@budgie/contracts';

const EMPTY_CATEGORIES: CategoryEntityInterface[] = [];

export const useAllCategoriesQuery = () => {
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findAll());

    if (!isDefined(data)) {
        return { isLoading: true, categories: EMPTY_CATEGORIES, updatedAt: null, error };
    }

    return { categories: data, isLoading: false, updatedAt, error };
};
