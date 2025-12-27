import { BankProviderEnum } from '@budgie/bank-sync';

import { SyncStatusEnum } from '../enum/sync-status.enum';

export interface AccountSyncCursorInterface {
    readonly accountId: number;
    readonly externalAccountId: string;
    readonly fromTime: Date;
    readonly toTime: Date;
    readonly completed: boolean;
}

export interface BankSyncStateInterface {
    readonly provider: BankProviderEnum;
    readonly enabled: boolean;
    readonly token: string | null;
    readonly status: SyncStatusEnum;
    readonly currentAccount: number;
    readonly totalAccounts: number;
    readonly totalTransactions: number;
    readonly errorCount: number;
    readonly error?: string;
    readonly lastSyncAt: string | null;
    readonly accountCursors: Record<number, AccountSyncCursorInterface>;
}

export const emptyBankSyncState = (provider: BankProviderEnum): BankSyncStateInterface => ({
    provider,
    enabled: false,
    token: null,
    status: SyncStatusEnum.IDLE,
    currentAccount: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    errorCount: 0,
    lastSyncAt: null,
    accountCursors: {}
});
