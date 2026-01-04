import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';

export const useGetEnabledRulesQuery = () => {
    const { data, updatedAt } = useLiveQuery(ruleRepository.findEnabledWithRelations());

    if (!isDefined(updatedAt)) {
        return { isLoading: true, rules: [] };
    }

    return { rules: data, isLoading: false };
};
