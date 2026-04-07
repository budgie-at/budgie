import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

import { useCachedBalanceQuery } from './use-cached-balance.query';

export const useAccountBalanceQuery = (accountId: number) =>
    useCachedBalanceQuery(accountBalanceRepository.getByAccountId(accountId), [accountId]);
