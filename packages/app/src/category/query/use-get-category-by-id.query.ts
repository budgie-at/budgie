import { CategoryEntityTable, CategoryRepository, DefaultCategoryTranslationEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { LanguageEnum } from '@budgie/contracts';

const noCategoryAtom = Atom.make(AsyncResult.success(null));

export const categoryByIdAtom = databaseQueryFamily(
    [CategoryEntityTable, DefaultCategoryTranslationEntityTable],
    CategoryRepository,
    (categoryRepository, [id, language]: readonly [number, LanguageEnum]) => categoryRepository.findById(id, language)
);

export const useGetCategoryByIdQuery = (id: number) => {
    const language = useSetting('language');
    const shouldQuery = isPositiveNumber(id);
    const result = useLiveAtomValue(shouldQuery ? categoryByIdAtom([id, language]) : noCategoryAtom);

    return {
        category: AsyncResult.getOrElse(result, () => null)?.at(0) ?? null,
        isLoading: AsyncResult.isInitial(result)
    };
};
