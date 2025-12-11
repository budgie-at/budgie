import { AccountBalanceEntityInterface, TransactionEntryEntityInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository } from '../../@generic/drizzle/db/db';
import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';
import { ONE_WEEK_IN_SECONDS } from '../constant/one-week-in-seconds.constant';

class AccountBalanceIncrementalService {
    async updateAllSnapshots(): Promise<void> {
        const accounts = await accountRepository.getAllActiveAccounts();
        if (isEmptyArray(accounts)) {
            return;
        }

        const accountIds = accounts.map(({ id }) => id);

        const [latestSnapshots, newEntries] = await Promise.all([
            accountBalanceRepository.getLatestSnapshots(accountIds),
            accountBalanceRepository.getNewTransactionEntries(accountIds)
        ]);

        const snapshotMap = this.buildSnapshotMap(latestSnapshots);
        const deltaMap = this.buildDeltaMap(newEntries);

        const snapshotsToInsert = this.buildNewSnapshots(accounts, snapshotMap, deltaMap);

        if (isNotEmptyArray(snapshotsToInsert)) {
            await accountBalanceRepository.insertSnapshots(snapshotsToInsert);
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

    private buildSnapshotMap(latestSnapshots: AccountBalanceEntityInterface[]) {
        return latestSnapshots.reduce((map, { accountId, amount }) => {
            map.set(accountId, amount);

            return map;
        }, new Map<number, number>());
    }

    private buildDeltaMap(entries: TransactionEntryEntityInterface[]) {
        return entries.reduce((map, { accountId, amount, type }) => {
            const delta = type === TransactionEntryTypeEnum.DEBIT ? amount : -amount;
            const total = (map.get(accountId) ?? 0) + delta;

            return map.set(accountId, total);
        }, new Map<number, number>());
    }

    private buildNewSnapshots(accounts: Array<{ id: number }>, snapshotMap: Map<number, number>, deltaMap: Map<number, number>) {
        return accounts.map(account => {
            const base = snapshotMap.get(account.id) ?? 0;
            const delta = deltaMap.get(account.id) ?? 0;

            return {
                amount: base + delta,
                accountId: account.id,
                parentAccountId: account.id,
            };
        });
    }
}

export const accountBalanceIncrementalService = new AccountBalanceIncrementalService();
