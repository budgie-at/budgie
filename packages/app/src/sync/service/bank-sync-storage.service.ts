import { BankProviderEnum, BankSyncBatchResultInterface } from '@budgie/bank-sync';
import { AccountEntityInterface } from '@budgie/contracts';
import * as SecureStore from 'expo-secure-store';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { transactionService } from '../../transaction/service/transaction.service';
import { getBankSyncStorageKey } from '../constant/bank-sync-storage-key.constant';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncStepEnum } from '../enum/sync-step.enum';
import { AccountSyncCursorInterface, BankSyncStateInterface, emptyBankSyncState } from '../interface/bank-sync-state.interface';

class BankSyncStorageService {
    getState(provider: BankProviderEnum): BankSyncStateInterface {
        const data = SecureStore.getItem(getBankSyncStorageKey(provider));

        if (!isDefined(data)) {
            return emptyBankSyncState(provider);
        }

        return JSON.parse(data) as BankSyncStateInterface;
    }

    setState(provider: BankProviderEnum, state: Partial<BankSyncStateInterface>): void {
        SecureStore.setItem(getBankSyncStorageKey(provider), JSON.stringify({ ...this.getState(provider), ...state }));
    }

    async startSync(provider: BankProviderEnum, accounts: AccountEntityInterface[]) {
        const nowSeconds = Math.floor(Date.now() / 1000);

        const accountCursors: Record<number, AccountSyncCursorInterface> = {};

        for (const account of accounts) {
            if (isNotEmptyString(account.externalId)) {
                // eslint-disable-next-line no-await-in-loop
                const latestTxTime = await transactionService.getLatestTransactionTimeByAccountExternalId(account.externalId);

                accountCursors[account.id] = {
                    accountId: account.id,
                    externalAccountId: account.externalId,
                    fromTime: isDefined(latestTxTime) ? Math.floor(latestTxTime.getTime() / 1000) : 0,
                    toTime: nowSeconds,
                    completed: false
                };
            }
        }

        this.setState(provider, {
            status: SyncStatusEnum.SYNCING,
            step: SyncStepEnum.SYNCING_ACCOUNTS,
            totalAccounts: Object.keys(accountCursors).length,
            currentAccount: 0,
            totalTransactions: 0,
            accountCursors
        });
    }

    updateAccountCursor(provider: BankProviderEnum, accountId: number, result: BankSyncBatchResultInterface): void {
        const state = this.getState(provider);

        const existingCursor = state.accountCursors[accountId];
        if (isDefined(existingCursor)) {
            this.setState(provider, {
                step: SyncStepEnum.SYNCING_TRANSACTIONS,
                totalTransactions: state.totalTransactions + result.transactions.length,
                accountCursors: {
                    ...state.accountCursors,
                    [accountId]: { ...existingCursor, toTime: result.nextToTime, completed: result.completed }
                }
            });
        }
    }

    getNextPendingAccountId(provider: BankProviderEnum): AccountSyncCursorInterface | null {
        const state = this.getState(provider);

        for (const cursor of Object.values(state.accountCursors)) {
            if (isDefined(cursor) && !cursor.completed) {
                return cursor;
            }
        }

        return null;
    }

    completeSync(provider: BankProviderEnum): void {
        this.setState(provider, {
            status: SyncStatusEnum.SUCCESS,
            step: SyncStepEnum.COMPLETED,
            lastSyncAt: new Date().toISOString()
        });
    }

    failSync(provider: BankProviderEnum, error: string): void {
        this.setState(provider, {
            status: SyncStatusEnum.ERROR,
            step: SyncStepEnum.ERROR,
            error
        });
    }

    resetSync(provider: BankProviderEnum): void {
        this.setState(provider, {
            status: SyncStatusEnum.IDLE,
            step: SyncStepEnum.IDLE,
            currentAccount: 0,
            totalAccounts: 0,
            totalTransactions: 0,
            accountCursors: {}
        });
    }

    isEnabled(provider: BankProviderEnum): boolean {
        return this.getState(provider).enabled;
    }

    setEnabled(provider: BankProviderEnum, enabled: boolean): void {
        this.setState(provider, { enabled });
    }

    getToken(provider: BankProviderEnum): string | null {
        return this.getState(provider).token;
    }

    setToken(provider: BankProviderEnum, token: string | null): void {
        this.setState(provider, { token });
    }

    hasToken(provider: BankProviderEnum): boolean {
        return isNotEmptyString(this.getToken(provider));
    }

    getAllActiveStates(): BankSyncStateInterface[] {
        const providers = Object.values(BankProviderEnum);

        return providers.map(provider => this.getState(provider)).filter(state => state.status !== SyncStatusEnum.IDLE);
    }
}

export const bankSyncStorageService = new BankSyncStorageService();
