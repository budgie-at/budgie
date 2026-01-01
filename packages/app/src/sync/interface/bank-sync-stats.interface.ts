import { BankSyncEntityInterface } from '@budgie/contracts';

export interface BankSyncStatsInterface {
    readonly totalAccounts: number;
    readonly totalTransactions: number;
    readonly syncs: BankSyncEntityInterface[];
    readonly isLoading: boolean;
    readonly status: 'idle' | 'loading' | 'failed';
}

export const emptyBankSyncStats: BankSyncStatsInterface = {
    status: 'idle',
    totalAccounts: 0,
    totalTransactions: 0,
    syncs: [],
    isLoading: true
};
