import { CategoryEntityTable, CategoryRepository, DefaultCategoryTranslationEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { CategoryEntityInterface, LanguageEnum } from '@budgie/contracts';

const EMPTY_CATEGORIES: CategoryEntityInterface[] = [];

const nonSystemCategoriesAtom = databaseQueryFamily(
    [CategoryEntityTable, DefaultCategoryTranslationEntityTable],
    CategoryRepository,
    (categoryRepository, language: LanguageEnum) => categoryRepository.findAllNonSystemLocalized(language)
);

export const useNonSystemCategoriesQuery = () => {
    const language = useSetting('language');
    const result = useLiveAtomValue(nonSystemCategoriesAtom(language));

    return { categories: AsyncResult.getOrElse(result, () => EMPTY_CATEGORIES), isLoading: AsyncResult.isInitial(result) };
};
