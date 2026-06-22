import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useGetRuleByIdQuery = (id: number) => {
    const { data, error, updatedAt } = useDatabaseLiveQuery(ruleRepository.findByIdWithRelations(id), [id]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, rule: null, error, updatedAt: null };
    }

    return { rule: data ?? null, isLoading: false, error, updatedAt };
};
