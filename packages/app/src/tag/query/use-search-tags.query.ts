import { TagEntityTable, TagRepository } from '@budgie/contracts';
import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useDeferredValue } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const searchTagsAtom = databaseQueryFamily([TagEntityTable], TagRepository, (tagRepository, search: string) =>
    tagRepository.findBySearchQuery(search)
);

export const useSearchTagsQuery = (search = '') => {
    const deferredSearch = useDeferredValue(search);
    const atom = searchTagsAtom(deferredSearch);
    const result = useLiveAtomValue(atom);
    const currentResult = useAtomValue(atom);
    const retry = useAtomRefresh(atom);

    return {
        tags: AsyncResult.getOrElse(result, () => null),
        isLoading: AsyncResult.isInitial(result),
        isSearchPending: search !== deferredSearch || AsyncResult.isInitial(currentResult),
        isFailure: AsyncResult.isFailure(result),
        retry
    };
};
