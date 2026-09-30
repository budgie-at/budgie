import { AccountBalanceRepository, AccountEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import { useCachedBalanceQuery } from './use-cached-balance.query';

const archivedAccountBalanceAtom = databaseQueryFamily(
    [AccountEntityTable, TransactionEntryEntityTable, TransactionEntityTable],
    AccountBalanceRepository,
    (accountBalanceRepository, accountId: number) => accountBalanceRepository.getArchivedAccountBalance(accountId)
);

export const useArchivedAccountBalanceQuery = (accountId: number) => useCachedBalanceQuery(archivedAccountBalanceAtom(accountId));
