import { AccountBalanceRepository } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { ACCOUNT_BALANCE_TABLES } from '../constant/account-balance-tables.constant';

import { useCachedBalanceQuery } from './use-cached-balance.query';

const accountBalanceAtom = databaseQueryFamily(
    ACCOUNT_BALANCE_TABLES,
    AccountBalanceRepository,
    (accountBalanceRepository, accountId: number) => accountBalanceRepository.getByAccountId(accountId)
);

export const useAccountBalanceQuery = (accountId: number) => useCachedBalanceQuery(accountBalanceAtom(accountId));
