import {
    CategoryEntityTable,
    CategoryRepository,
    DefaultCategoryTranslationEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { LanguageEnum } from '@budgie/contracts';

const searchCategoriesAtom = databaseQueryFamily(
    [CategoryEntityTable, DefaultCategoryTranslationEntityTable, TransactionEntryEntityTable],
    CategoryRepository,
    (categoryRepository, [search, includeDefault, language]: readonly [string, boolean, LanguageEnum]) =>
        categoryRepository.findBySearchQuery(search, includeDefault, language)
);

export const useSearchCategoriesQuery = (search: string, includeDefault: boolean) => {
    const language = useSetting('language');
    const result = useLiveAtomValue(searchCategoriesAtom([search, includeDefault, language]));

    return { categories: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};
