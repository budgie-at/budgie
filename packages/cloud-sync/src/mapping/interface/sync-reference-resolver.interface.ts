import type { SyncIdentityInterface } from './sync-identity.interface';

export interface SyncReferenceResolverInterface {
    readonly findSyncIdentity: (tableName: string, localId: number) => SyncIdentityInterface | null;
    readonly findNaturalKey: (tableName: string, localId: number) => string | null;
}
