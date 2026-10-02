import { TagEntityTable, TagRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const searchTagsAtom = databaseQueryFamily([TagEntityTable], TagRepository, (tagRepository, search: string) =>
    tagRepository.findBySearchQuery(search)
);

export const useSearchTagsQuery = (search = '') => {
    const result = useLiveAtomValue(searchTagsAtom(search));

    return { tags: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};
