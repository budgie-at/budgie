import {
    CategoryEntityTable,
    CategoryRepository,
    DefaultCategoryTranslationEntityTable,
    PERSONAL_SYNC_ZONE,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { LanguageEnum } from '@budgie/contracts';

export const searchCategoriesAtom = databaseQueryFamily(
    [CategoryEntityTable, DefaultCategoryTranslationEntityTable, TransactionEntryEntityTable],
    CategoryRepository,
    (categoryRepository, [search, includeDefault, language, syncZone]: readonly [string, boolean, LanguageEnum, string]) =>
        categoryRepository.findBySearchQuery(search, includeDefault, language, syncZone)
);

export const useSearchCategoriesQuery = (search: string, includeDefault: boolean, syncZone: string = PERSONAL_SYNC_ZONE) => {
    const language = useSetting('language');
    const atom = searchCategoriesAtom([search, includeDefault, language, syncZone]);
    const result = useLiveAtomValue(atom);
    const currentResult = useAtomValue(atom);
    const retry = useAtomRefresh(atom);

    return {
        categories: AsyncResult.getOrElse(result, () => null),
        isLoading: AsyncResult.isInitial(result),
        isSearchPending: AsyncResult.isInitial(currentResult),
        isFailure: AsyncResult.isFailure(result),
        retry
    };
};
