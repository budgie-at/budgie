import type { FileBasedSyncClientInterface } from './file-based-sync-client.interface';
import type { BankAccountInterface } from '@budgie/bank-sync';

export interface ParsedFileResultInterface {
    readonly client: FileBasedSyncClientInterface;
    readonly bankAccounts: BankAccountInterface[];
}
