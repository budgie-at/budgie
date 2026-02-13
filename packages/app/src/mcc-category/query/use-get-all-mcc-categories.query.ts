import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { mccCategoryRepository } from '../../@generic/drizzle/db/db';

export const useGetAllMccCategoriesQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(mccCategoryRepository.findAll());

    if (!isDefined(data)) {
        return { isLoading: true, mccCategories: [] as typeof data, updatedAt: null, error };
    }

    return { mccCategories: data, isLoading: false, updatedAt, error };
};
