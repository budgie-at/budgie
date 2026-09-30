import { AccountBalanceRepository, AccountRepository, AccountTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { runWithDb } from '../db/run-with-db';

import type { DB } from '@budgie/contracts';

export const assertStoredBalancesMatchLedger = async (database: DB): Promise<void> => {
    const accountBalanceRepository = new AccountBalanceRepository(database);
    const mismatches = await runWithDb(database)(
        Effect.gen(function* () {
            const accounts = yield* new AccountRepository(database).getAllActiveAccountsExceptBankAuthoritative();
            const accountIds = accounts.filter(({ type }) => type !== AccountTypeEnum.DEBT).map(({ id }) => id);
            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances(accountIds);
            const storedBalances = yield* accountBalanceRepository.getByAccountIds(accountIds);

            return storedBalances
                .filter(({ accountId, amount }) => amount !== (ledgerBalances.get(accountId) ?? 0))
                .map(({ accountId, amount }) => `account=${accountId} stored=${amount} ledger=${ledgerBalances.get(accountId) ?? 0}`);
        })
    );

    if (isNotEmptyArray(mismatches)) {
        throw new Error(`Stored balances drifted from the ledger: ${mismatches.join('; ')}`);
    }
};
