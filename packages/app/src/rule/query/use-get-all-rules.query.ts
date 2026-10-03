import {
    AccountEntityTable,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    RuleActionEntityTable,
    RuleConditionEntityTable,
    RuleEntityTable,
    TagEntityTable
} from '@budgie/contracts';
import { RuleRepository } from '@budgie/rules';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { LanguageEnum } from '@budgie/contracts';

const allRulesAtom = databaseQueryFamily(
    [
        RuleEntityTable,
        RuleConditionEntityTable,
        RuleActionEntityTable,
        CategoryEntityTable,
        DefaultCategoryTranslationEntityTable,
        TagEntityTable,
        AccountEntityTable
    ],
    RuleRepository,
    (ruleRepository, [language]: readonly [LanguageEnum, number]) => ruleRepository.findAllWithActionsAndCategories(language)
);

export const useGetAllRulesQuery = (refreshKey = 0) => {
    const language = useSetting('language');
    const result = useLiveAtomValue(allRulesAtom([language, refreshKey]));

    return { rules: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};
