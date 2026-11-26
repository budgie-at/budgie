import { CategoryEntityTable, CategoryRepository, DefaultCategoryTranslationEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { LanguageEnum } from '@budgie/contracts';

const categoriesByIdsAtom = databaseQueryFamily(
    [CategoryEntityTable, DefaultCategoryTranslationEntityTable],
    CategoryRepository,
    (categoryRepository, [ids, language]: readonly [readonly number[], LanguageEnum]) =>
        categoryRepository.findByIdsLocalized(ids, language)
);

export const useGetCategoriesByIdsQuery = (ids: readonly number[]) => {
    const language = useSetting('language');
    const result = useLiveAtomValue(categoriesByIdsAtom([[...new Set(ids)].sort((left, right) => left - right), language]));

    return AsyncResult.getOrElse(result, () => []);
};
