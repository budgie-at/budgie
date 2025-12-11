import { AccountBalanceEntityInterface, TransactionEntryEntityInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { ZERO_AMOUNT } from '../../@generic/constant/zero-amount.constant';
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
            map.set(accountId, BigInt(amount));

            return map;
        }, new Map<number, bigint>());
    }

    private buildDeltaMap(entries: TransactionEntryEntityInterface[]) {
        return entries.reduce((map, { accountId, amount, type }) => {
            const delta = type === TransactionEntryTypeEnum.DEBIT ? BigInt(amount) : -BigInt(amount);
            const total = (map.get(accountId) ?? ZERO_AMOUNT) + delta;

            return map.set(accountId, total);
        }, new Map<number, bigint>());
    }

    private buildNewSnapshots(accounts: Array<{ id: number }>, snapshotMap: Map<number, bigint>, deltaMap: Map<number, bigint>) {
        return accounts.map(account => {
            const base = snapshotMap.get(account.id) ?? ZERO_AMOUNT;
            const delta = deltaMap.get(account.id) ?? ZERO_AMOUNT;

            return {
                accountId: account.id,
                parentAccountId: account.id,
                amount: Number(base + delta)
            };
        });
    }
}

export const accountBalanceIncrementalService = new AccountBalanceIncrementalService();
