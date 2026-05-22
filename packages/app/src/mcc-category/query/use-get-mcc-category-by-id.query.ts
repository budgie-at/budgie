import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { mccCategoryRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetMccCategoryByIdQuery = (id: number | null) => {
    const shouldFetch = isDefined(id) && isPositiveNumber(id);
    const { data, updatedAt, error } = useLiveQuery(mccCategoryRepository.findById(id ?? 0), [id]);

    if (!shouldFetch) {
        return { isLoading: false, mccCategory: null, updatedAt: null, error: null };
    }

    if (!isDefined(data)) {
        return { isLoading: true, mccCategory: null, updatedAt: null, error };
    }

    return { mccCategory: data, isLoading: false, updatedAt, error };
};
