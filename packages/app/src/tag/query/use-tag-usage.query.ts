import { TagRepository, TransactionEntityTable, TransactionTagsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const tagUsageAtom = databaseQueryAtom(
    [TransactionTagsEntityTable, TransactionEntityTable],
    Effect.flatMap(TagRepository, tagRepository => tagRepository.findUsage())
);

export const useTagUsageQuery = (tagId: number) =>
    AsyncResult.getOrElse(useLiveAtomValue(tagUsageAtom), () => []).find(usage => usage.id === tagId);
