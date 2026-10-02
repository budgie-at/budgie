import type { FileBasedSyncClientInterface } from './file-based-sync-client.interface';
import type { ParsedFileResultInterface } from './parsed-file-result.interface';
import type { SyncAccountInterface } from './sync-account.interface';
import type { SyncError } from './sync-error.type';
import type { SyncServiceDefinitionInterface } from './sync-service-definition.interface';
import type { SyncTransactionInterface } from './sync-transaction.interface';
import type { Db, DbError, MccCategoryLookupInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export interface FileSyncServiceDefinitionInterface extends Omit<SyncServiceDefinitionInterface, 'afterSyncEnabledChange'> {
    readonly parseFile: (uri: string) => Effect.Effect<ParsedFileResultInterface, SyncError>;
    readonly resolveMccCategoryIdMap: (
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ) => Effect.Effect<Map<string, MccCategoryLookupInterface | null>, DbError, Db>;
    readonly resolveMccCategoryLookupKey?: (transaction: SyncTransactionInterface) => string;
}
