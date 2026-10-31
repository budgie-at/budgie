import { CategoryRepository, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import { useSearchCategoriesQuery } from './use-search-categories.query';

export const categoryUsageAtom = databaseQueryAtom(
    [TransactionEntryEntityTable, TransactionEntityTable],
    Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.findUsage())
);

export const useCustomCategoriesWithUsageQuery = (search: string) => {
    const { categories, isFailure, retry } = useSearchCategoriesQuery(search, false);
    const usageResult = useLiveAtomValue(categoryUsageAtom);

    return {
        categories: AsyncResult.isInitial(usageResult) ? null : categories,
        usage: AsyncResult.getOrElse(usageResult, () => null),
        isFailure,
        retry
    };
};
