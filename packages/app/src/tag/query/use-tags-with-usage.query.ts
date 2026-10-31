import { TagRepository, TransactionEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import { useSearchTagsQuery } from './use-search-tags.query';

export const tagUsageAtom = databaseQueryAtom(
    [TransactionTagsEntityTable, TransactionEntityTable],
    Effect.flatMap(TagRepository, tagRepository => tagRepository.findUsage())
);

export const useTagsWithUsageQuery = (search: string) => {
    const { tags, isFailure, retry } = useSearchTagsQuery(search);
    const usageResult = useLiveAtomValue(tagUsageAtom);

    return {
        tags: AsyncResult.isInitial(usageResult) ? null : tags,
        usage: AsyncResult.getOrElse(usageResult, () => null),
        isFailure,
        retry
    };
};
