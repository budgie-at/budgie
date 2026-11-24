import { MccCategoryEntityTable, MccCategoryRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const noMccCategoryAtom = Atom.make(AsyncResult.success(null));

export const mccCategoryByIdAtom = databaseQueryFamily(
    [MccCategoryEntityTable],
    MccCategoryRepository,
    (mccCategoryRepository, id: number) => mccCategoryRepository.findById(id)
);

export const useGetMccCategoryByIdQuery = (id: number | null) => {
    const shouldQuery = isPositiveNumber(id);
    const result = useLiveAtomValue(shouldQuery ? mccCategoryByIdAtom(id) : noMccCategoryAtom);

    if (!shouldQuery) {
        return { isLoading: false, mccCategory: null };
    }

    return { mccCategory: AsyncResult.getOrElse(result, () => null) ?? null, isLoading: AsyncResult.isInitial(result) };
};
