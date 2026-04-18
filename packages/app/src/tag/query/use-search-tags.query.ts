import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { tagRepository } from '../../@generic/drizzle/db/db';
import { toFtsQuery } from '../../@generic/utils/to-fts-query.util';

export const useSearchTagsQuery = (query = '') => {
    const ftsQuery = toFtsQuery(query);
    const searchArg = ftsQuery ?? '';
    const { data, error, updatedAt } = useLiveQuery(tagRepository.findBySearchQuery(searchArg), [searchArg]);
    const { data: countData } = useLiveQuery(tagRepository.count(), []);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, tags: null, total: 0, error, updatedAt: null };
    }

    return { tags: data, total: countData.at(0)?.count ?? 0, isLoading: false, error, updatedAt };
};
