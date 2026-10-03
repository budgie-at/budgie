import type { FileBasedSyncClientInterface } from './file-based-sync-client.interface';
import type { SyncAccountInterface } from './sync-account.interface';

export interface ParsedFileResultInterface {
    readonly client: FileBasedSyncClientInterface;
    readonly bankAccounts: SyncAccountInterface[];
}
