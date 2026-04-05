import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

import { useCachedBalanceQuery } from './use-cached-balance.query';

export const useArchivedAccountBalanceQuery = (accountId: number) =>
    useCachedBalanceQuery(accountBalanceRepository.getArchivedAccountBalance(accountId), [accountId]);
