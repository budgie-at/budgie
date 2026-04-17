import type { BankAccountInterface } from '../interface/bank-account.interface';
import type { BankClientInfoInterface } from '../interface/bank-client-info.interface';
import type { BankSyncResultInterface } from '../interface/bank-sync-result.type';
import type { BankTransactionInterface } from '../interface/bank-transaction.interface';

export interface BankProviderClientInterface {
    getClientInfo(): Promise<BankSyncResultInterface<BankClientInfoInterface>>;
    getAccounts(): Promise<BankSyncResultInterface<BankAccountInterface[]>>;
    getTransactions(accountId: string, from: number, to?: number): Promise<BankSyncResultInterface<BankTransactionInterface[]>>;
}
