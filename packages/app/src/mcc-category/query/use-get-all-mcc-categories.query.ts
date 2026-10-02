import { MccCategoryEntityTable, MccCategoryRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { MccCategoryEntityInterface } from '@budgie/contracts';

const EMPTY_MCC_CATEGORIES: MccCategoryEntityInterface[] = [];

const allMccCategoriesAtom = databaseQueryAtom(
    [MccCategoryEntityTable],
    Effect.flatMap(MccCategoryRepository, mccCategoryRepository => mccCategoryRepository.findAll())
);

export const useGetAllMccCategoriesQuery = () => {
    const result = useLiveAtomValue(allMccCategoriesAtom);

    return { mccCategories: AsyncResult.getOrElse(result, () => EMPTY_MCC_CATEGORIES), isLoading: AsyncResult.isInitial(result) };
};
