import { BankProviderEnum, BankSyncBatchResultInterface } from '@budgie/bank-sync';
import { AccountEntityInterface } from '@budgie/contracts';
import * as SecureStore from 'expo-secure-store';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { transactionService } from '../../transaction/service/transaction.service';
import { getBankSyncStorageKey } from '../constant/bank-sync-storage-key.constant';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { AccountSyncCursorInterface, BankSyncStateInterface, emptyBankSyncState } from '../interface/bank-sync-state.interface';

class BankSyncStorageService {
    getState(provider: BankProviderEnum): BankSyncStateInterface {
        const data = SecureStore.getItem(getBankSyncStorageKey(provider));

        if (!isDefined(data)) {
            return emptyBankSyncState(provider);
        }

        const serialized = JSON.parse(data) as BankSyncStateInterface;

        return {
            ...serialized,
            accountCursors: Object.keys(serialized.accountCursors).reduce(
                (acc, key) => ({
                    ...acc,
                    [Number(key)]: {
                        ...serialized.accountCursors[Number(key)],
                        fromTime: new Date(serialized.accountCursors[Number(key)].fromTime),
                        toTime: new Date(serialized.accountCursors[Number(key)].toTime)
                    }
                }),
                {}
            )
        };
    }

    setState(provider: BankProviderEnum, state: Partial<BankSyncStateInterface>): void {
        SecureStore.setItem(getBankSyncStorageKey(provider), JSON.stringify({ ...this.getState(provider), ...state }));
    }

    async startSync(provider: BankProviderEnum, accounts: AccountEntityInterface[]) {
        const accountCursors: Record<number, AccountSyncCursorInterface> = {};

        for (const account of accounts) {
            if (isNotEmptyString(account.externalId)) {
                // eslint-disable-next-line no-await-in-loop
                const earliestTxTime = await transactionService.getEarliestTransactionTimeByAccountId(account.id);

                accountCursors[account.id] = {
                    accountId: account.id,
                    externalAccountId: account.externalId,
                    fromTime: new Date(),
                    toTime: isDefined(earliestTxTime) ? earliestTxTime : new Date(),
                    completedAt: null,
                    startedAt: null,
                    completed: false
                };
            }
        }

        this.setState(provider, {
            status: SyncStatusEnum.SYNCING,
            totalAccounts: Object.keys(accountCursors).length,
            totalTransactions: 0,
            accountCursors
        });
    }

    updateAccountCursor(provider: BankProviderEnum, accountId: number, result: BankSyncBatchResultInterface): void {
        const state = this.getState(provider);

        this.setState(provider, {
            error: '',
            errorCount: 0,
            totalTransactions: state.totalTransactions + result.transactions.length,
            accountCursors: {
                ...state.accountCursors,
                [accountId]: {
                    ...state.accountCursors[accountId],
                    toTime: result.nextTo,
                    fromTime: result.nextFrom,
                    completed: result.completed,
                    ...(result.completed && { completedAt: new Date() })
                }
            }
        });
    }

    getNextPendingAccountId(provider: BankProviderEnum): AccountSyncCursorInterface | null {
        const state = this.getState(provider);

        for (const cursor of Object.values(state.accountCursors)) {
            if (isDefined(cursor) && !cursor.completed) {
                this.setState(provider, {
                    accountCursors: {
                        ...state.accountCursors,
                        [cursor.accountId]: {
                            ...cursor,
                            ...(!isDefined(cursor.startedAt) && { startedAt: new Date() })
                        }
                    }
                });

                return cursor;
            }
        }

        return null;
    }

    completeSync(provider: BankProviderEnum): void {
        this.setState(provider, {
            status: SyncStatusEnum.SUCCESS,
            // eslint-disable-next-line no-undefined
            error: undefined,
            errorCount: 0,
            lastSyncAt: new Date().toISOString()
        });
    }

    failSync(provider: BankProviderEnum, error: string): void {
        const state = this.getState(provider);

        this.setState(provider, {
            error,
            errorCount: state.errorCount + 1
        });
    }

    isEnabled(provider: BankProviderEnum): boolean {
        return this.getState(provider).enabled;
    }

    failedSync(provider: BankProviderEnum, error: string): void {
        this.setState(provider, {
            error,
            enabled: false,
            status: SyncStatusEnum.FAILED
        });
    }

    setEnabled(provider: BankProviderEnum, enabled: boolean): void {
        if (enabled) {
            this.setState(provider, { enabled });
        } else {
            const state = this.getState(provider);

            this.setState(provider, {
                ...emptyBankSyncState(provider),
                enabled: false,
                token: state.token
            });
        }
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
