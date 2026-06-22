import type { BankAccountInterface } from './bank-account.interface';
import type { BankTransactionInterface } from './bank-transaction.interface';

export interface FileBasedBankSyncClientInterface {
    getAccounts(): BankAccountInterface[];
    getTransactions(accountId: string): BankTransactionInterface[];
}
