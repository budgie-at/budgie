import type { FileBasedSyncClientInterface } from './file-based-sync-client.interface';
import type { SyncAccountInterface } from '@budgie/sync';

export interface ParsedFileResultInterface {
    readonly client: FileBasedSyncClientInterface;
    readonly bankAccounts: SyncAccountInterface[];
}
