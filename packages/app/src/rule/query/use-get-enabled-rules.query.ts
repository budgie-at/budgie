import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useGetEnabledRulesQuery = () => {
    const { data, updatedAt } = useDatabaseLiveQuery(ruleRepository.findEnabledWithRelations());

    if (!isDefined(updatedAt)) {
        return { enabledRules: [], isLoading: true };
    }

    return { enabledRules: data, isLoading: false };
};
