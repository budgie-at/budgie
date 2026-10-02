import { MccCategoryEntityTable, MccCategoryRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const mccCategoryByIdAtom = databaseQueryFamily([MccCategoryEntityTable], MccCategoryRepository, (mccCategoryRepository, id: number) =>
    mccCategoryRepository.findById(id)
);

export const useGetMccCategoryByIdQuery = (id: number | null) => {
    const shouldFetch = isDefined(id) && isPositiveNumber(id);
    const result = useLiveAtomValue(mccCategoryByIdAtom(id ?? 0));

    if (!shouldFetch) {
        return { isLoading: false, mccCategory: null };
    }

    return { mccCategory: AsyncResult.getOrElse(result, () => null) ?? null, isLoading: AsyncResult.isInitial(result) };
};
