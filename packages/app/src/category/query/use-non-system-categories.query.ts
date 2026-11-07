import { CategoryEntityTable, CategoryRepository, DefaultCategoryTranslationEntityTable, PERSONAL_SYNC_ZONE } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { CategoryEntityInterface, LanguageEnum } from '@budgie/contracts';

const EMPTY_CATEGORIES: CategoryEntityInterface[] = [];

export const nonSystemCategoriesAtom = databaseQueryFamily(
    [CategoryEntityTable, DefaultCategoryTranslationEntityTable],
    CategoryRepository,
    (categoryRepository, [language, syncZone]: readonly [LanguageEnum, string]) =>
        categoryRepository.findAllNonSystemLocalized(language, syncZone)
);

export const useNonSystemCategoriesQuery = (syncZone: string = PERSONAL_SYNC_ZONE) => {
    const language = useSetting('language');
    const result = useLiveAtomValue(nonSystemCategoriesAtom([language, syncZone]));

    return { categories: AsyncResult.getOrElse(result, () => EMPTY_CATEGORIES), isLoading: AsyncResult.isInitial(result) };
};
