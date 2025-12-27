import { BankProviderEnum } from '@budgie/bank-sync';

import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncStepEnum } from '../enum/sync-step.enum';

export interface AccountSyncCursorInterface {
    readonly accountId: number;
    readonly externalAccountId: string;
    readonly fromTime: number;
    readonly toTime: number;
    readonly completed: boolean;
}

export interface BankSyncStateInterface {
    readonly provider: BankProviderEnum;
    readonly enabled: boolean;
    readonly token: string | null;
    readonly status: SyncStatusEnum;
    readonly step: SyncStepEnum;
    readonly currentAccount: number;
    readonly totalAccounts: number;
    readonly totalTransactions: number;
    readonly error?: string;
    readonly lastSyncAt: string | null;
    readonly accountCursors: Record<number, AccountSyncCursorInterface>;
}

export const emptyBankSyncState = (provider: BankProviderEnum): BankSyncStateInterface => ({
    provider,
    enabled: false,
    token: null,
    status: SyncStatusEnum.IDLE,
    step: SyncStepEnum.IDLE,
    currentAccount: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    lastSyncAt: null,
    accountCursors: {}
});
