import { BankProviderEnum, BankSyncBatchResultInterface } from '@budgie/bank-sync';
import { AccountEntityInterface } from '@budgie/contracts';
import * as SecureStore from 'expo-secure-store';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { FIFTEEN_MINUTES_IN_SECONDS } from '../../account/constant/fifteen-minutes-in-seconds.constant';
import { transactionService } from '../../transaction/service/transaction.service';
import { getBankSyncStorageKey } from '../constant/bank-sync-storage-key.constant';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { AccountSyncCursorInterface, emptyAccountSyncCursor } from '../interface/account-sync-cursor.interface';
import { BankSyncStateInterface, emptyBankSyncState } from '../interface/bank-sync-state.interface';

class BankSyncStorageService {
    getState(provider: BankProviderEnum): BankSyncStateInterface {
        const data = SecureStore.getItem(getBankSyncStorageKey(provider));

        if (!isDefined(data)) {
            return emptyBankSyncState(provider);
        }

        const serialized = JSON.parse(data) as Partial<BankSyncStateInterface>;
        const accountCursors = serialized.accountCursors ?? {};

        return {
            ...emptyBankSyncState(provider),
            ...serialized,
            accountCursors: Object.keys(accountCursors).reduce((acc, key) => {
                const cursor = accountCursors[Number(key)];

                if (!isDefined(cursor)) {
                    return acc;
                }

                return {
                    ...acc,
                    [Number(key)]: {
                        ...emptyAccountSyncCursor(),
                        ...cursor,
                        fromTime: new Date(cursor.fromTime),
                        toTime: new Date(cursor.toTime)
                    }
                };
            }, {})
        };
    }

    setState(provider: BankProviderEnum, state: Partial<BankSyncStateInterface>): void {
        SecureStore.setItem(getBankSyncStorageKey(provider), JSON.stringify({ ...this.getState(provider), ...state }));
    }

    async startSync(provider: BankProviderEnum, accounts: AccountEntityInterface[]) {
        const state = this.getState(provider);
        const accountCursors: Record<number, AccountSyncCursorInterface> = {};
        const now = new Date();

        for (const account of accounts) {
            if (isNotEmptyString(account.externalId)) {
                const existingCursor = state.accountCursors[account.id];
                const hasCompletedHistoricalSync = isDefined(existingCursor) && isDefined(existingCursor.historySyncedTill);

                if (hasCompletedHistoricalSync) {
                    accountCursors[account.id] = {
                        ...emptyAccountSyncCursor(),
                        ...existingCursor,
                        fromTime: now,
                        toTime: now
                    };
                } else {
                    // eslint-disable-next-line no-await-in-loop
                    const earliestTxTime = await transactionService.getEarliestTransactionTimeByAccountId(account.id);

                    accountCursors[account.id] = {
                        ...emptyAccountSyncCursor(),
                        ...existingCursor,
                        accountId: account.id,
                        accountName: account.title,
                        externalAccountId: account.externalId,
                        fromTime: now,
                        toTime: isDefined(earliestTxTime) ? earliestTxTime : now
                    };
                }
            }
        }

        this.setState(provider, {
            status: SyncStatusEnum.SYNCING,
            totalAccounts: Object.keys(accountCursors).length,
            accountCursors
        });
    }

    updateAccountCursor(provider: BankProviderEnum, accountId: number, result: BankSyncBatchResultInterface): void {
        const state = this.getState(provider);
        const cursor = state.accountCursors[accountId];
        const now = new Date();

        this.setState(provider, {
            error: '',
            errorCount: 0,
            totalTransactions: state.totalTransactions + result.transactions.length,
            accountCursors: {
                ...state.accountCursors,
                [accountId]: {
                    ...cursor,
                    toTime: result.nextTo,
                    fromTime: result.nextFrom,
                    completed: result.completed,
                    transactionCount: cursor.transactionCount + result.transactions.length,
                    ...(result.completed && {
                        completedAt: now,
                        fromTime: now,
                        toTime: now,
                        historySyncedTill: cursor.fromTime
                    })
                }
            }
        });
    }

    getNextPendingAccountId(provider: BankProviderEnum): AccountSyncCursorInterface | null {
        const state = this.getState(provider);

        const needsBackwardSync = Object.values(state.accountCursors).filter(cursor => cursor.enabled && !cursor.completed);
        const needsForwardSync = Object.values(state.accountCursors).filter(
            cursor =>
                cursor.enabled &&
                cursor.completed &&
                isDefined(cursor.historySyncedTill) &&
                Date.now() - cursor.fromTime.getTime() > FIFTEEN_MINUTES_IN_SECONDS * 1000
        );

        const cursor = needsBackwardSync.at(0) ?? needsForwardSync.at(0) ?? null;
        if (isDefined(cursor)) {
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

        return null;
    }

    setAccountEnabled(provider: BankProviderEnum, accountId: number, enabled: boolean): void {
        const state = this.getState(provider);
        const cursor = state.accountCursors[accountId];

        // TODO: Improve this logic
        if (isDefined(cursor)) {
            this.setState(provider, {
                accountCursors: {
                    ...state.accountCursors,
                    [accountId]: {
                        ...cursor,
                        enabled,
                        ...(enabled &&
                            cursor.completed && {
                                completed: false,
                                startedAt: null,
                                completedAt: null
                            })
                    }
                }
            });
        }
    }

    completeSync(provider: BankProviderEnum): void {
        this.setState(provider, {
            status: SyncStatusEnum.IDLE,
            // eslint-disable-next-line no-undefined
            error: undefined,
            errorCount: 0,
            lastSyncAt: new Date().toISOString()
        });
    }

    failSync(provider: BankProviderEnum, error: string): void {
        const state = this.getState(provider);

        this.setState(provider, { error, errorCount: state.errorCount + 1 });
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

    truncate(provider: BankProviderEnum): void {
        const state = this.getState(provider);

        this.setState(provider, {
            ...emptyBankSyncState(provider),
            token: state.token
        });
    }
}

export const bankSyncStorageService = new BankSyncStorageService();
