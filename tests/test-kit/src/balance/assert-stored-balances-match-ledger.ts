import { AccountBalanceRepository, AccountRepository, AccountTypeEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { DB } from '@budgie/contracts';

export const assertStoredBalancesMatchLedger = async (database: DB): Promise<void> => {
    const accountBalanceRepository = new AccountBalanceRepository(database);
    const accounts = await new AccountRepository(database).getAllActiveAccountsExceptBankAuthoritative();
    const accountIds = accounts.filter(({ type }) => type !== AccountTypeEnum.DEBT).map(({ id }) => id);
    const ledgerBalances = await accountBalanceRepository.getLedgerBalances(accountIds);
    const mismatches = (await accountBalanceRepository.getByAccountIds(accountIds))
        .filter(({ accountId, amount }) => amount !== (ledgerBalances.get(accountId) ?? 0))
        .map(({ accountId, amount }) => `account=${accountId} stored=${amount} ledger=${ledgerBalances.get(accountId) ?? 0}`);

    if (isNotEmptyArray(mismatches)) {
        throw new Error(`Stored balances drifted from the ledger: ${mismatches.join('; ')}`);
    }
};
