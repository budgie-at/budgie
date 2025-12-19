import { CategoryEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect } from 'react';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';

export const useAllCategoriesQuery = (onLoaded: (categories: CategoryEntityInterface[]) => void) => {
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findAll());

    useEffect(() => {
        if (isDefined(data)) {
            onLoaded(data);
        }
    }, [data, onLoaded]);

    if (!isDefined(data)) {
        return { isLoading: true, categories: [], updatedAt: null, error };
    }

    return { categories: data, isLoading: false, updatedAt, error };
};
