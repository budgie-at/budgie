import { CategoryRepository, PERSONAL_SYNC_ZONE, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { useEntityUsage } from '../../@generic/hook/use-entity-usage.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import { useSearchCategoriesQuery } from './use-search-categories.query';

export const categoryUsageAtom = databaseQueryAtom(
    [TransactionEntryEntityTable, TransactionEntityTable],
    Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.findUsage)
);

export const useCategoriesWithUsageQuery = (search: string, includeDefault: boolean, syncZone: string = PERSONAL_SYNC_ZONE) => {
    const { categories, isSearchPending, isFailure, retry } = useSearchCategoriesQuery(search, includeDefault, syncZone);
    const { isUsagePending, ...usage } = useEntityUsage(categoryUsageAtom);

    return {
        ...usage,
        categories: isSearchPending || isUsagePending ? null : categories,
        isFailure,
        retry
    };
};
