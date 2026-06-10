import type { BankAccountInterface, BankTransactionInterface } from '@budgie/bank-sync';

export interface FileBasedSyncClientInterface {
    getAccounts(): BankAccountInterface[];
    getTransactions(accountId: string): BankTransactionInterface[];
}
