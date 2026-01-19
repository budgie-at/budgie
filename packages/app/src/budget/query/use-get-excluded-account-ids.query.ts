import { AccountBudgetExclusionEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBudgetExclusionRepository } from '../../@generic/drizzle/db/db';

export const useGetExcludedAccountIdsQuery = () => {
    const { data, ...rest } = useLiveQuery(accountBudgetExclusionRepository.findAll(), []);
    const excludedAccountIds = new Set(data.map((exclusion: AccountBudgetExclusionEntityInterface) => exclusion.accountId));

    return { excludedAccountIds, ...rest };
};
