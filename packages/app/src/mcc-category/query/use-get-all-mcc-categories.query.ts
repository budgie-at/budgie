import { isDefined } from '@rnw-community/shared';

import { mccCategoryRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

import type { MccCategoryEntityInterface } from '@budgie/contracts';

const EMPTY_MCC_CATEGORIES: MccCategoryEntityInterface[] = [];

export const useGetAllMccCategoriesQuery = () => {
    const { data, updatedAt, error } = useDatabaseLiveQuery(mccCategoryRepository.findAll());

    if (!isDefined(data)) {
        return { isLoading: true, mccCategories: EMPTY_MCC_CATEGORIES, updatedAt: null, error };
    }

    return { mccCategories: data, isLoading: false, updatedAt, error };
};
