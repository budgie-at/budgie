import { isDefined } from '@rnw-community/shared';

import { tagRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useSearchTagsQuery = (query = '') => {
    const { data, error, updatedAt } = useLiveQuery(tagRepository.findBySearchQuery(query), [query]);
    const { data: countData } = useLiveQuery(tagRepository.count(), []);
    const countRows = countData ?? [];

    if (!isDefined(updatedAt)) {
        return { isLoading: true, tags: null, total: 0, error, updatedAt: null };
    }

    return { tags: data ?? [], total: countRows.at(0)?.count ?? 0, isLoading: false, error, updatedAt };
};
