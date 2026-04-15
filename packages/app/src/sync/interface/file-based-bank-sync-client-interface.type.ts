import type { BankAccountInterface, BankTransactionInterface } from '@budgie/bank-sync';

export interface FileBasedBankSyncClientInterface {
    getAccounts(): BankAccountInterface[];
    getTransactions(accountId: string): BankTransactionInterface[];
}
