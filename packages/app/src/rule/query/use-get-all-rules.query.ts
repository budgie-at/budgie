import { isDefined } from '@rnw-community/shared';

import { ruleRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetAllRulesQuery = (refreshKey = 0) => {
    const { data, error, updatedAt } = useLiveQuery(ruleRepository.findAllWithActionsAndCategories(), [refreshKey]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, rules: null, error, updatedAt: null };
    }

    return { rules: data, isLoading: false, error, updatedAt };
};
