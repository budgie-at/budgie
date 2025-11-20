import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { tagRepository } from '../../@generic/drizzle/db/db';

export const useGetTagsLiveQuery = (query: string) => {
    const { data, error, updatedAt } = useLiveQuery(tagRepository.findBySearchQuery(query), [query]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, tags: null, error, updatedAt: null };
    }

    return { tags: data, isLoading: false, error, updatedAt };
};
