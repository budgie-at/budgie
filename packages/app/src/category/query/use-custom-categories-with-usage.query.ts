import { CategoryRepository, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import { useSearchCategoriesQuery } from './use-search-categories.query';

const categoryUsageAtom = databaseQueryAtom(
    [TransactionEntryEntityTable, TransactionEntityTable],
    Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.findUsage())
);

export const useCustomCategoriesWithUsageQuery = (search: string) => {
    const { categories } = useSearchCategoriesQuery(search, false);
    const usage = AsyncResult.getOrElse(useLiveAtomValue(categoryUsageAtom), () => null);

    return { categories: isDefined(usage) ? categories : null, usage };
};
