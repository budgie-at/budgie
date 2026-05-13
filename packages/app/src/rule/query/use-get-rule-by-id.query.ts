import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';

export const useGetRuleByIdQuery = (id: number) => {
    const { data, error, updatedAt } = useLiveQuery(ruleRepository.findByIdWithRelations(id), [id]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, rule: null, error, updatedAt: null };
    }

    return { rule: data ?? null, isLoading: false, error, updatedAt };
};
