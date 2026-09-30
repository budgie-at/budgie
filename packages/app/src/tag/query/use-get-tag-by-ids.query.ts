import { TagEntityTable, TagRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const tagsByIdsAtom = Atom.family((ids: readonly number[]) =>
    databaseQueryAtom(
        [TagEntityTable],
        Effect.flatMap(TagRepository, tagRepository => tagRepository.findByIds([...ids]))
    )
);

export const useGetTagByIdsQuery = (ids: number[]) => {
    const result = useLiveAtomValue(tagsByIdsAtom(ids));

    return { tags: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};
