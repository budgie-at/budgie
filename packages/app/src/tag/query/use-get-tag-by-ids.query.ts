import { TagEntityTable, TagRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const tagsByIdsAtom = databaseQueryFamily([TagEntityTable], TagRepository, (tagRepository, ids: readonly number[]) =>
    tagRepository.findByIds([...ids])
);

export const useGetTagByIdsQuery = (ids: number[]) => {
    const result = useLiveAtomValue(tagsByIdsAtom(ids));

    return { tags: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};
