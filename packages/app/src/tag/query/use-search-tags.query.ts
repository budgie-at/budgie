import { TagEntityTable, TagRepository } from '@budgie/contracts';
import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const searchTagsAtom = databaseQueryFamily([TagEntityTable], TagRepository, (tagRepository, search: string) =>
    tagRepository.findBySearchQuery(search)
);

export const useSearchTagsQuery = (search = '') => {
    const atom = searchTagsAtom(search);
    const result = useLiveAtomValue(atom);
    const currentResult = useAtomValue(atom);
    const retry = useAtomRefresh(atom);

    return {
        tags: AsyncResult.getOrElse(result, () => null),
        isLoading: AsyncResult.isInitial(result),
        isSearchPending: AsyncResult.isInitial(currentResult),
        isFailure: AsyncResult.isFailure(result),
        retry
    };
};
