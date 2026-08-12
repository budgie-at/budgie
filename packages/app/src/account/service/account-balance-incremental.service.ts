import {
    AccountTypeEnum,
    type AccountBalanceCreateEntityInterface,
    type AccountBalanceEntityInterface,
    type AccountEntityInterface,
    type DB,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { i18n } from '@lingui/core';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository, db } from '../../@generic/drizzle/db/db';
import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';
import { DepositTransactionSafetyErrorEnum } from '../enum/deposit-transaction-safety-error.enum';

class AccountBalanceIncrementalService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 7 * 24 * 60;

    @Log(
        (truncate, tx) => `enter truncate=${String(truncate)} tx=${String(isDefined(tx))}`,
        (result, truncate, tx) => `done truncate=${String(truncate)} tx=${String(isDefined(tx))} result=${String(result)}`,
        (error, truncate, tx) => `throw truncate=${String(truncate)} tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async updateAllBalances(truncate: boolean, tx?: DB): Promise<void> {
        if (!isDefined(tx)) {
            await transactionAsync(db, async innerTx => this.updateAllBalancesInTransaction(truncate, innerTx));

            return;
        }

        await this.updateAllBalancesInTransaction(truncate, tx);
    }

    @Log(
        (accountIds, tx) => `enter accountIds=${accountIds.join(',')} tx=${String(isDefined(tx))}`,
        (_, accountIds, tx) => `done accountIds=${accountIds.join(',')} tx=${String(isDefined(tx))}`,
        (error, accountIds, tx) => `throw accountIds=${accountIds.join(',')} tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async updateBalancesByAccountIds(accountIds: number[], tx?: DB): Promise<void> {
        const uniqueAccountIds = [...new Set(accountIds)];

        if (isEmptyArray(uniqueAccountIds)) {
            return;
        }

        if (!isDefined(tx)) {
            await transactionAsync(db, async innerTx => this.updateBalancesByUniqueAccountIdsInTransaction(uniqueAccountIds, innerTx));

            return;
        }

        await this.updateBalancesByUniqueAccountIdsInTransaction(uniqueAccountIds, tx);
    }

    @Log('enter', result => `done result=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(ACCOUNT_BALANCE_INCREMENTAL_TASK);
        if (isRegistered) {
            return;
        }

        await BackgroundTask.registerTaskAsync(ACCOUNT_BALANCE_INCREMENTAL_TASK, {
            minimumInterval: AccountBalanceIncrementalService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    private async updateAllBalancesInTransaction(truncate: boolean, tx: DB): Promise<void> {
        const accounts = await accountRepository.getAllActiveAccounts(tx);
        const previousDepositBalances = await this.getPreviousDepositBalances(accounts, tx);

        await this.upsertLatestBalances(accounts, truncate, previousDepositBalances, tx);
    }

    private async updateBalancesByUniqueAccountIdsInTransaction(uniqueAccountIds: number[], tx: DB): Promise<void> {
        const accounts = await accountRepository.findByIds(uniqueAccountIds, tx);
        if (isEmptyArray(accounts)) {
            return;
        }

        const activeAccountIds = accounts.map(({ id }) => id);
        const previousDepositBalances = await this.getPreviousDepositBalances(accounts, tx);

        await accountBalanceRepository.deleteByAccountIds(activeAccountIds, tx);
        await this.upsertLatestBalances(accounts, false, previousDepositBalances, tx);
    }

    private async upsertLatestBalances(
        accounts: AccountEntityInterface[],
        truncate: boolean,
        previousDepositBalances: Map<number, number>,
        tx?: DB
    ): Promise<void> {
        if (isEmptyArray(accounts)) {
            return;
        }

        await this.truncateBalances(truncate, tx);

        const accountIds = accounts.map(({ id }) => id);
        const currentBalances = await accountBalanceRepository.getByAccountIds(accountIds, tx);
        const deltaMap = await accountBalanceRepository.getNewTransactionEntriesDeltas(accountIds, tx);

        const balancesMap = this.buildBalancesMap(currentBalances);

        const balancesToInsert = accounts.map(account => this.buildBalanceInput(account.id, balancesMap, deltaMap));

        await this.upsertBalances(balancesToInsert, tx);
        this.assertDepositBalancesNotWorsened(balancesToInsert, previousDepositBalances);
    }

    private buildBalancesMap(balances: AccountBalanceEntityInterface[]) {
        return balances.reduce((map, { accountId, amount }) => {
            map.set(accountId, amount);

            return map;
        }, new Map<number, number>());
    }

    private buildBalanceInput(
        accountId: number,
        balancesMap: Map<number, number>,
        deltaMap: Map<number, number>
    ): AccountBalanceCreateEntityInterface {
        const base = balancesMap.get(accountId) ?? 0;
        const delta = deltaMap.get(accountId) ?? 0;

        return {
            amount: base + delta,
            accountId,
            updatedAt: new Date()
        };
    }

    private async truncateBalances(truncate: boolean, tx?: DB): Promise<void> {
        if (!truncate) {
            return;
        }

        await accountBalanceRepository.truncate(tx);
    }

    private async upsertBalances(balances: AccountBalanceCreateEntityInterface[], tx?: DB): Promise<void> {
        await balances.reduce<Promise<void>>(async (previousBalancePromise, balance) => {
            await previousBalancePromise;
            await accountBalanceRepository.upsert(balance, tx);
        }, Promise.resolve());
    }

    private async getPreviousDepositBalances(accounts: AccountEntityInterface[], tx?: DB): Promise<Map<number, number>> {
        const depositAccountIds = accounts.filter(account => account.type === AccountTypeEnum.DEPOSIT).map(({ id }) => id);

        if (isEmptyArray(depositAccountIds)) {
            return new Map();
        }

        const balances = await accountBalanceRepository.getByAccountIds(depositAccountIds, tx);
        const balancesMap = this.buildBalancesMap(balances);

        return depositAccountIds.reduce((map, accountId) => {
            map.set(accountId, balancesMap.get(accountId) ?? 0);

            return map;
        }, new Map<number, number>());
    }

    private assertDepositBalancesNotWorsened(
        balances: AccountBalanceCreateEntityInterface[],
        previousDepositBalances: Map<number, number>
    ): void {
        for (const balance of balances) {
            const previousBalance = previousDepositBalances.get(balance.accountId);
            const shouldReject = isDefined(previousBalance) && balance.amount < 0 && balance.amount < previousBalance;

            if (shouldReject) {
                const messageDescriptor = {
                    id: DepositTransactionSafetyErrorEnum.NEGATIVE_DEPOSIT_BALANCE
                };

                throw new Error(isNotEmptyString(i18n.locale) ? i18n._(messageDescriptor) : messageDescriptor.id);
            }
        }
    }
}

export const accountBalanceIncrementalService = new AccountBalanceIncrementalService();
