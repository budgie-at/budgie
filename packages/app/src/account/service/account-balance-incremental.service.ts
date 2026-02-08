import { AccountBalanceEntityInterface } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository } from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';
import { ONE_WEEK_IN_SECONDS } from '../constant/one-week-in-seconds.constant';

class AccountBalanceIncrementalService {
    async updateAllBalances(truncate: boolean, tx?: Transaction): Promise<void> {
        const totalStart = performance.now();
        // eslint-disable-next-line no-console
        console.log('[perf] accountBalance.updateAllBalances START'); // eslint-disable-line lingui/no-unlocalized-strings

        const accounts = await accountRepository.getAllActiveAccounts();
        if (isEmptyArray(accounts)) {
            return;
        }

        if (truncate) {
            await accountBalanceRepository.truncate(tx);
        }

        const accountIds = accounts.map(({ id }) => id);

        let stepStart = performance.now();
        const [currentBalances, deltaMap] = await Promise.all([
            accountBalanceRepository.getByAccountIds(accountIds),
            accountBalanceRepository.getNewTransactionEntriesDeltas(accountIds)
        ]);
        // eslint-disable-next-line no-console
        console.log(`[perf] accountBalance queries: ${Math.round(performance.now() - stepStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings

        const balancesMap = this.buildBalancesMap(currentBalances);

        const balancesToInsert = accounts.map(account => {
            const base = balancesMap.get(account.id) ?? 0;
            const delta = deltaMap.get(account.id) ?? 0;

            return {
                amount: base + delta,
                accountId: account.id,
                updatedAt: new Date()
            };
        });

        if (isNotEmptyArray(balancesToInsert)) {
            stepStart = performance.now();
            await Promise.all(balancesToInsert.map(async balance => accountBalanceRepository.upsert(balance, tx)));
            // eslint-disable-next-line no-console
            console.log(`[perf] accountBalance upserts (${balancesToInsert.length}): ${Math.round(performance.now() - stepStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings
        }

        // eslint-disable-next-line no-console
        console.log(`[perf] accountBalance.updateAllBalances TOTAL: ${Math.round(performance.now() - totalStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings
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
