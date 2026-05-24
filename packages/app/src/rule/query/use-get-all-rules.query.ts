import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const useGetAllRulesQuery = (refreshKey = 0) => {
    const language = useSetting('language');
    const { data, error, updatedAt } = useLiveQuery(ruleRepository.findAllWithActionsAndCategories(language), [refreshKey, language]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, rules: null, error, updatedAt: null };
    }

    return { rules: data, isLoading: false, error, updatedAt };
};
