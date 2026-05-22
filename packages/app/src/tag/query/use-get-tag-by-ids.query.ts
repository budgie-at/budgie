import { isDefined } from '@rnw-community/shared';

import { tagRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetTagByIdsQuery = (ids: number[]) => {
    const idsKey = ids.join(',');
    const { data, updatedAt, error } = useLiveQuery(tagRepository.findByIds(ids), [idsKey]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, tags: null, updatedAt: null, error };
    }

    return { tags: data ?? [], isLoading: false, updatedAt, error };
};
