import { TagRepository, TransactionEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { useEntityUsage } from '../../@generic/hook/use-entity-usage.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import { useSearchTagsQuery } from './use-search-tags.query';

export const tagUsageAtom = databaseQueryAtom(
    [TransactionTagsEntityTable, TransactionEntityTable],
    Effect.flatMap(TagRepository, tagRepository => tagRepository.findUsage())
);

export const useTagsWithUsageQuery = (search: string) => {
    const { tags, isSearchPending, isFailure, retry } = useSearchTagsQuery(search);
    const { isUsagePending, ...usage } = useEntityUsage(tagUsageAtom);

    return {
        ...usage,
        tags: isSearchPending || isUsagePending ? null : tags,
        isFailure,
        retry
    };
};
