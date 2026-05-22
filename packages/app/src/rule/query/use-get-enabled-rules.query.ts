import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetEnabledRulesQuery = () => {
    const { data, updatedAt } = useLiveQuery(ruleRepository.findEnabledWithRelations());

    if (!isDefined(updatedAt)) {
        return { enabledRules: [], isLoading: true };
    }

    return { enabledRules: data ?? [], isLoading: false };
};
