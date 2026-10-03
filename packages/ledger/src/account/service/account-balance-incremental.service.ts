import { AccountBalanceRepository, AccountRepository, AccountTypeEnum, Db, getDebtLedgerBalance } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { DepositNegativeBalanceError } from '../error/deposit-negative-balance.error';

import type { AccountBalanceCreateEntityInterface, AccountBalanceEntityInterface, AccountEntityInterface } from '@budgie/contracts';

export class AccountBalanceIncrementalService extends Context.Service<AccountBalanceIncrementalService>()(
    '@budgie/ledger/AccountBalanceIncrementalService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const accountBalanceRepository = yield* AccountBalanceRepository;

            const buildBalancesMap = (balances: AccountBalanceEntityInterface[]) =>
                balances.reduce((map, { accountId, amount }) => {
                    map.set(accountId, amount);

                    return map;
                }, new Map<number, number>());

            const buildBalanceInput = (
                account: AccountEntityInterface,
                ledgerBalances: Map<number, number>,
                debtLedgerBalances: Map<number, number>
            ): AccountBalanceCreateEntityInterface => ({
                amount: debtLedgerBalances.get(account.id) ?? ledgerBalances.get(account.id) ?? 0,
                accountId: account.id
            });

            const getDebtLedgerBalances = Effect.fn('AccountBalanceIncrementalService.getDebtLedgerBalances')(function* (
                accounts: AccountEntityInterface[]
            ) {
                const debtAccounts = accounts.filter(account => account.type === AccountTypeEnum.DEBT);

                if (isEmptyArray(debtAccounts)) {
                    return new Map<number, number>();
                }

                const ledgerAmounts = yield* accountBalanceRepository.getDebtLedgerAmounts(debtAccounts.map(({ id }) => id));
                const ledgerAmountsMap = new Map(ledgerAmounts.map(ledgerAmount => [ledgerAmount.accountId, ledgerAmount]));

                return debtAccounts.reduce((map, account) => {
                    const ledgerAmount = ledgerAmountsMap.get(account.id);
                    const openedAmount = ledgerAmount?.openedAmount ?? 0;

                    map.set(
                        account.id,
                        getDebtLedgerBalance(
                            ledgerAmount?.closedAmount ?? 0,
                            account.debtType,
                            isPositiveNumber(openedAmount) ? openedAmount : account.targetBalance
                        )
                    );

                    return map;
                }, new Map<number, number>());
            });

            const getPreviousDepositBalances = Effect.fn('AccountBalanceIncrementalService.getPreviousDepositBalances')(function* (
                accounts: AccountEntityInterface[]
            ) {
                const depositAccountIds = accounts.filter(account => account.type === AccountTypeEnum.DEPOSIT).map(({ id }) => id);

                if (isEmptyArray(depositAccountIds)) {
                    return new Map<number, number>();
                }

                const balances = yield* accountBalanceRepository.getByAccountIds(depositAccountIds);
                const balancesMap = buildBalancesMap(balances);

                return depositAccountIds.reduce((map, accountId) => {
                    map.set(accountId, balancesMap.get(accountId) ?? 0);

                    return map;
                }, new Map<number, number>());
            });

            const assertDepositBalancesNotWorsened = Effect.fn('AccountBalanceIncrementalService.assertDepositBalancesNotWorsened')(
                function* (balances: AccountBalanceCreateEntityInterface[], previousDepositBalances: Map<number, number>) {
                    for (const balance of balances) {
                        const previousBalance = previousDepositBalances.get(balance.accountId);
                        const shouldReject = isDefined(previousBalance) && balance.amount < 0 && balance.amount < previousBalance;

                        if (shouldReject) {
                            return yield* new DepositNegativeBalanceError();
                        }
                    }
                }
            );

            const upsertLatestBalances = Effect.fn('AccountBalanceIncrementalService.upsertLatestBalances')(function* (
                accounts: AccountEntityInterface[],
                truncate: boolean,
                previousDepositBalances: Map<number, number>
            ) {
                if (isEmptyArray(accounts)) {
                    return;
                }

                if (truncate) {
                    yield* accountBalanceRepository.truncateExceptBankAuthoritative();
                }

                const accountIds = accounts.map(({ id }) => id);
                const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances(accountIds);
                const debtLedgerBalances = yield* getDebtLedgerBalances(accounts);

                const balancesToInsert = accounts.map(account => buildBalanceInput(account, ledgerBalances, debtLedgerBalances));

                yield* Effect.forEach(balancesToInsert, balance => accountBalanceRepository.upsert(balance), { discard: true });
                yield* assertDepositBalancesNotWorsened(balancesToInsert, previousDepositBalances);
            });

            return {
                updateAllBalances: Effect.fn('AccountBalanceIncrementalService.updateAllBalances')(
                    function* (truncate: boolean) {
                        const accounts = yield* accountRepository.getAllActiveAccountsExceptBankAuthoritative();
                        const previousDepositBalances = yield* getPreviousDepositBalances(accounts);

                        yield* upsertLatestBalances(accounts, truncate, previousDepositBalances);
                    },
                    effect => Db.transaction(effect)
                ),
                updateBalancesByAccountIds: Effect.fn('AccountBalanceIncrementalService.updateBalancesByAccountIds')(
                    function* (accountIds: number[]) {
                        const uniqueAccountIds = [...new Set(accountIds)];

                        if (isEmptyArray(uniqueAccountIds)) {
                            return;
                        }

                        const accounts = yield* accountRepository.findByIdsExceptBankAuthoritative(uniqueAccountIds);
                        if (isEmptyArray(accounts)) {
                            return;
                        }

                        const activeAccountIds = accounts.map(({ id }) => id);
                        const previousDepositBalances = yield* getPreviousDepositBalances(accounts);

                        yield* accountBalanceRepository.deleteByAccountIds(activeAccountIds);
                        yield* upsertLatestBalances(accounts, false, previousDepositBalances);
                    },
                    effect => Db.transaction(effect)
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(AccountBalanceIncrementalService, AccountBalanceIncrementalService.make).pipe(
        Layer.provide([AccountRepository.layer, AccountBalanceRepository.layer])
    );
}
