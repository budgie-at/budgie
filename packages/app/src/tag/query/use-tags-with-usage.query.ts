import { TagRepository, TransactionEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import { useSearchTagsQuery } from './use-search-tags.query';

const tagUsageAtom = databaseQueryAtom(
    [TransactionTagsEntityTable, TransactionEntityTable],
    Effect.flatMap(TagRepository, tagRepository => tagRepository.findUsage())
);

export const useTagsWithUsageQuery = (search: string) => {
    const { tags } = useSearchTagsQuery(search);
    const usage = AsyncResult.getOrElse(useLiveAtomValue(tagUsageAtom), () => null);

    return { tags: isDefined(usage) ? tags : null, usage };
};
