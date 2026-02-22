import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { tagRepository } from '../../@generic/drizzle/db/db';

export const useGetTagByIdsQuery = (ids: number[]) => {
    const idsKey = ids.join(',');
    const { data, updatedAt, error } = useLiveQuery(tagRepository.findByIds(ids), [idsKey]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, tags: null, updatedAt: null, error };
    }

    return { tags: data, isLoading: false, updatedAt, error };
};
