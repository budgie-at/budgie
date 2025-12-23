import { AccountBalanceEntityInterface } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository } from '../../@generic/drizzle/db/db';
import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';
import { ONE_WEEK_IN_SECONDS } from '../constant/one-week-in-seconds.constant';

class AccountBalanceIncrementalService {
    async updateAllBalances(updatedAt?: Date): Promise<void> {
        const accounts = await accountRepository.getAllActiveAccounts();
        if (isEmptyArray(accounts)) {
            return;
        }

        const accountIds = accounts.map(({ id }) => id);

        const [currentBalances, deltaMap] = await Promise.all([
            accountBalanceRepository.getByAccountIds(accountIds),
            accountBalanceRepository.getNewTransactionEntriesDeltas(accountIds)
        ]);

        console.log({ deltaMap });

        const balancesMap = this.buildBalancesMap(currentBalances);

        const balancesToInsert = accounts.map(account => {
            const base = balancesMap.get(account.id) ?? 0;
            const delta = deltaMap.get(account.id) ?? 0;

            return {
                amount: base + delta,
                accountId: account.id,
                updatedAt: updatedAt ?? new Date()
            };
        });

        if (isNotEmptyArray(balancesToInsert)) {
            await Promise.all(balancesToInsert.map(async balance => accountBalanceRepository.upsert(balance)));
        }
    }

    async registerBackgroundTask(): Promise<void> {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(ACCOUNT_BALANCE_INCREMENTAL_TASK);
        if (isRegistered) {
            return;
        }

        await BackgroundTask.registerTaskAsync(ACCOUNT_BALANCE_INCREMENTAL_TASK, {
            minimumInterval: ONE_WEEK_IN_SECONDS
        });
    }

    private buildBalancesMap(balances: AccountBalanceEntityInterface[]) {
        return balances.reduce((map, { accountId, amount }) => {
            map.set(accountId, amount);

            return map;
        }, new Map<number, number>());
    }
}

export const accountBalanceIncrementalService = new AccountBalanceIncrementalService();
