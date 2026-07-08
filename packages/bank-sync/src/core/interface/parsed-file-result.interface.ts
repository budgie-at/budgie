import type { BankAccountInterface } from './bank-account.interface';
import type { FileBasedBankSyncClientInterface } from './file-based-bank-sync-client.interface';

export interface ParsedFileResultInterface {
    readonly client: FileBasedBankSyncClientInterface;
    readonly bankAccounts: BankAccountInterface[];
}
