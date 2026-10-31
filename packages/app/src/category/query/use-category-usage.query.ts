import { CategoryRepository, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const categoryUsageAtom = databaseQueryAtom(
    [TransactionEntryEntityTable, TransactionEntityTable],
    Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.findUsage())
);

export const useCategoryUsageQuery = (categoryId: number) =>
    AsyncResult.getOrElse(useLiveAtomValue(categoryUsageAtom), () => []).find(usage => usage.id === categoryId);
