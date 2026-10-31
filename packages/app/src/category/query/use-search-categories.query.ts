import {
    CategoryEntityTable,
    CategoryRepository,
    DefaultCategoryTranslationEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { LanguageEnum } from '@budgie/contracts';

export const searchCategoriesAtom = databaseQueryFamily(
    [CategoryEntityTable, DefaultCategoryTranslationEntityTable, TransactionEntryEntityTable],
    CategoryRepository,
    (categoryRepository, [search, includeDefault, language]: readonly [string, boolean, LanguageEnum]) =>
        categoryRepository.findBySearchQuery(search, includeDefault, language)
);

export const useSearchCategoriesQuery = (search: string, includeDefault: boolean) => {
    const language = useSetting('language');
    const atom = searchCategoriesAtom([search, includeDefault, language]);
    const result = useLiveAtomValue(atom);
    const retry = useAtomRefresh(atom);

    return {
        categories: AsyncResult.getOrElse(result, () => null),
        isLoading: AsyncResult.isInitial(result),
        isFailure: AsyncResult.isFailure(result),
        retry
    };
};
