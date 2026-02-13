import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';

export const useGetAllRulesQuery = () => {
    const { data, error, updatedAt } = useLiveQuery(ruleRepository.findAllWithActionsAndCategories());

    if (!isDefined(updatedAt)) {
        return { isLoading: true, rules: null, error, updatedAt: null };
    }

    return { rules: data, isLoading: false, error, updatedAt };
};
