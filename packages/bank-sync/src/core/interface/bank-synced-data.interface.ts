import type { BankAccountInterface } from './bank-account.interface';
import type { BankTransactionInterface } from './bank-transaction.interface';

export interface BankSyncedDataInterface {
    readonly accounts: BankAccountInterface[];
    readonly transactions: BankTransactionInterface[];
}
