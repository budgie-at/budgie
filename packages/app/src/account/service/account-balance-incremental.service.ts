import { getLogger } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isEmptyArray } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository } from '../../@generic/drizzle/db/db';
import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';
import { ONE_WEEK_IN_SECONDS } from '../constant/one-week-in-seconds.constant';

import type { AccountBalanceCreateEntityInterface, AccountBalanceEntityInterface, DB } from '@budgie/contracts';

const logger = getLogger('AccountBalanceIncrementalService');

class AccountBalanceIncrementalService {
    async updateAllBalances(truncate: boolean, tx?: DB): Promise<void> {
        const startedAt = Date.now();
        const accounts = await accountRepository.getAllActiveAccounts(tx);
        if (isEmptyArray(accounts)) {
            logger.log('updateAllBalances:duration', { truncate, accountCount: 0, durationMs: Date.now() - startedAt });

            return;
        }

        await this.truncateBalances(truncate, tx);

        const accountIds = accounts.map(({ id }) => id);

        const [currentBalances, deltaMap] = await Promise.all([
            accountBalanceRepository.getByAccountIds(accountIds, tx),
            accountBalanceRepository.getNewTransactionEntriesDeltas(accountIds, tx)
        ]);

        const balancesMap = this.buildBalancesMap(currentBalances);

        const balancesToInsert = accounts.map(account => this.buildBalanceInput(account.id, balancesMap, deltaMap));

        await Promise.all(balancesToInsert.map(async balance => accountBalanceRepository.upsert(balance, tx)));

        logger.log('updateAllBalances:duration', {
            truncate,
            accountCount: accounts.length,
            balanceCount: balancesToInsert.length,
            durationMs: Date.now() - startedAt
        });
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
}

export const accountBalanceIncrementalService = new AccountBalanceIncrementalService();
