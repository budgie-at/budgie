import type { FileBasedBankSyncClientInterface } from './file-based-bank-sync-client.interface';
import type { BankAccountInterface } from '@budgie/bank-sync';

export interface ParsedFileResultInterface {
    readonly client: FileBasedBankSyncClientInterface;
    readonly bankAccounts: BankAccountInterface[];
}
