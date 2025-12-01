import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';

export const useGetCategoryByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useLiveQuery(categoryRepository.findById(id), [id]);

    if (!isDefined(data)) {
        return { isLoading: true, category: null, updatedAt: null, error };
    }

    return { category: data, isLoading: false, updatedAt, error };
};
