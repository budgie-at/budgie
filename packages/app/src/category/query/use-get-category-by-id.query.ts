import { CategoryEntityTable, CategoryRepository, DefaultCategoryTranslationEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { LanguageEnum } from '@budgie/contracts';

const categoryByIdAtom = databaseQueryFamily(
    [CategoryEntityTable, DefaultCategoryTranslationEntityTable],
    CategoryRepository,
    (categoryRepository, [id, language]: readonly [number, LanguageEnum]) => categoryRepository.findById(id, language)
);

export const useGetCategoryByIdQuery = (id: number) => {
    const language = useSetting('language');
    const result = useLiveAtomValue(categoryByIdAtom([id, language]));

    return {
        category: AsyncResult.getOrElse(result, () => []).at(0) ?? null,
        isLoading: AsyncResult.isInitial(result)
    };
};
