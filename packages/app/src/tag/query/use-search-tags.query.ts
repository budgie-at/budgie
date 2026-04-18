import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { tagRepository } from '../../@generic/drizzle/db/db';

export const useSearchTagsQuery = (query = '') => {
    const { data, error, updatedAt } = useLiveQuery(tagRepository.findBySearchQuery(query), [query]);
    const { data: countData } = useLiveQuery(tagRepository.count(), []);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, tags: null, total: 0, error, updatedAt: null };
    }

    return { tags: data, total: countData.at(0)?.count ?? 0, isLoading: false, error, updatedAt };
};
