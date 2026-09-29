import { AccountTypeEnum, Db, getDebtLedgerBalance } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository } from '../../@generic/drizzle/db/db';
import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';
import { DepositNegativeBalanceError } from '../error/deposit-negative-balance.error';

import type { AccountBalanceCreateEntityInterface, AccountBalanceEntityInterface, AccountEntityInterface } from '@budgie/contracts';

class AccountBalanceIncrementalService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 7 * 24 * 60;

    readonly updateAllBalances = Effect.fn('AccountBalanceIncrementalService.updateAllBalances')(
        function* (this: AccountBalanceIncrementalService, truncate: boolean) {
            const accounts = yield* accountRepository.getAllActiveAccountsExceptBankAuthoritative();
            const previousDepositBalances = yield* this.getPreviousDepositBalances(accounts);

            yield* this.upsertLatestBalances(accounts, truncate, previousDepositBalances);
        },
        effect => Db.transaction(effect)
    );

    readonly updateBalancesByAccountIds = Effect.fn('AccountBalanceIncrementalService.updateBalancesByAccountIds')(
        function* (this: AccountBalanceIncrementalService, accountIds: number[]) {
            const uniqueAccountIds = [...new Set(accountIds)];

            if (isEmptyArray(uniqueAccountIds)) {
                return;
            }

            const accounts = yield* accountRepository.findByIdsExceptBankAuthoritative(uniqueAccountIds);
            if (isEmptyArray(accounts)) {
                return;
            }

            const activeAccountIds = accounts.map(({ id }) => id);
            const previousDepositBalances = yield* this.getPreviousDepositBalances(accounts);

            yield* accountBalanceRepository.deleteByAccountIds(activeAccountIds);
            yield* this.upsertLatestBalances(accounts, false, previousDepositBalances);
        },
        effect => Db.transaction(effect)
    );

    readonly registerBackgroundTask = Effect.fn('AccountBalanceIncrementalService.registerBackgroundTask')(function* () {
        const isRegistered = yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(ACCOUNT_BALANCE_INCREMENTAL_TASK));
        if (isRegistered) {
            return;
        }

        yield* Effect.tryPromise(() =>
            BackgroundTask.registerTaskAsync(ACCOUNT_BALANCE_INCREMENTAL_TASK, {
                minimumInterval: AccountBalanceIncrementalService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
            })
        );
    });

    private readonly upsertLatestBalances = Effect.fn('AccountBalanceIncrementalService.upsertLatestBalances')(function* (
        this: AccountBalanceIncrementalService,
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
        const debtLedgerBalances = yield* this.getDebtLedgerBalances(accounts);

        const balancesToInsert = accounts.map(account => this.buildBalanceInput(account, ledgerBalances, debtLedgerBalances));

        yield* Effect.forEach(balancesToInsert, balance => accountBalanceRepository.upsert(balance), { discard: true });
        yield* this.assertDepositBalancesNotWorsened(balancesToInsert, previousDepositBalances);
    });

    private readonly getDebtLedgerBalances = Effect.fn('AccountBalanceIncrementalService.getDebtLedgerBalances')(function* (
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

    private readonly getPreviousDepositBalances = Effect.fn('AccountBalanceIncrementalService.getPreviousDepositBalances')(function* (
        this: AccountBalanceIncrementalService,
        accounts: AccountEntityInterface[]
    ) {
        const depositAccountIds = accounts.filter(account => account.type === AccountTypeEnum.DEPOSIT).map(({ id }) => id);

        if (isEmptyArray(depositAccountIds)) {
            return new Map<number, number>();
        }

        const balances = yield* accountBalanceRepository.getByAccountIds(depositAccountIds);
        const balancesMap = this.buildBalancesMap(balances);

        return depositAccountIds.reduce((map, accountId) => {
            map.set(accountId, balancesMap.get(accountId) ?? 0);

            return map;
        }, new Map<number, number>());
    });

    private readonly assertDepositBalancesNotWorsened = Effect.fn('AccountBalanceIncrementalService.assertDepositBalancesNotWorsened')(
        function* (balances: AccountBalanceCreateEntityInterface[], previousDepositBalances: Map<number, number>) {
            for (const balance of balances) {
                const previousBalance = previousDepositBalances.get(balance.accountId);
                const shouldReject = isDefined(previousBalance) && balance.amount < 0 && balance.amount < previousBalance;

                if (shouldReject) {
                    yield* new DepositNegativeBalanceError();
                }
            }
        }
    );

    private buildBalancesMap(balances: AccountBalanceEntityInterface[]) {
        return balances.reduce((map, { accountId, amount }) => {
            map.set(accountId, amount);

            return map;
        }, new Map<number, number>());
    }

    private buildBalanceInput(
        account: AccountEntityInterface,
        ledgerBalances: Map<number, number>,
        debtLedgerBalances: Map<number, number>
    ): AccountBalanceCreateEntityInterface {
        return {
            amount: debtLedgerBalances.get(account.id) ?? ledgerBalances.get(account.id) ?? 0,
            accountId: account.id
        };
    }
}

export const accountBalanceIncrementalService = new AccountBalanceIncrementalService();
