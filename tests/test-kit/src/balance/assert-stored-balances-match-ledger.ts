import { AccountBalanceRepository, AccountRepository, AccountTypeEnum, Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { DB } from '@budgie/contracts';

export const assertStoredBalancesMatchLedger = async (database: DB): Promise<void> => {
    const mismatches = await Effect.runPromise(
        Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accounts = yield* accountRepository.getAllActiveAccountsExceptBankAuthoritative();
            const accountIds = accounts.filter(({ type }) => type !== AccountTypeEnum.DEBT).map(({ id }) => id);
            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances(accountIds);
            const storedBalances = yield* accountBalanceRepository.getByAccountIds(accountIds);

            return storedBalances
                .filter(({ accountId, amount }) => amount !== (ledgerBalances.get(accountId) ?? 0))
                .map(({ accountId, amount }) => `account=${accountId} stored=${amount} ledger=${ledgerBalances.get(accountId) ?? 0}`);
        }).pipe(
            Effect.provide(Layer.mergeAll(AccountRepository.layer, AccountBalanceRepository.layer)),
            Effect.provideService(Db, database)
        )
    );

    if (isNotEmptyArray(mismatches)) {
        throw new Error(`Stored balances drifted from the ledger: ${mismatches.join('; ')}`);
    }
};
