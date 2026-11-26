import { TagEntityTable, TagRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { TagEntityInterface } from '@budgie/contracts';

const EMPTY_TAGS: TagEntityInterface[] = [];

const emptyTagsAtom = Atom.make(AsyncResult.success(EMPTY_TAGS));

export const tagsByIdsAtom = databaseQueryFamily([TagEntityTable], TagRepository, (tagRepository, ids: readonly number[]) =>
    tagRepository.findByIds([...ids])
);

export const useGetTagByIdsQuery = (ids: number[]) => {
    const normalizedIds = isEmptyArray(ids) ? [] : [...new Set(ids)].sort((left, right) => left - right);
    const result = useLiveAtomValue(isEmptyArray(normalizedIds) ? emptyTagsAtom : tagsByIdsAtom(normalizedIds));

    return { tags: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};
