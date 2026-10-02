import type { SyncBatchResultInterface } from './sync-batch-result.interface';
import type { SyncServiceDefinitionInterface } from './sync-service-definition.interface';
import type { Db, SyncEntityInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';
import type * as HttpClient from 'effect/http/HttpClient';
import type * as Schema from 'effect/Schema';

export interface PollingSyncServiceDefinitionInterface extends Omit<SyncServiceDefinitionInterface, 'afterSyncEnabledChange'> {
    readonly rateLimitMs: number;
    readonly backgroundTaskName: string;
    readonly shouldRequestSyncWhenEnabled?: boolean;
    readonly executeSyncBatch: (sync: SyncEntityInterface) => Effect.Effect<SyncBatchResultInterface, unknown, Db | HttpClient.HttpClient>;
    readonly beforeSyncRun: (deadlineAtMs: number) => Effect.Effect<void, unknown, Db>;
    readonly beforeProcessRun?: (firstSyncToken: string) => Effect.Effect<void, unknown, Db | HttpClient.HttpClient>;
    readonly applyProgressUpdate?: (
        sync: SyncEntityInterface,
        result: SyncBatchResultInterface
    ) => Effect.Effect<void, unknown, Db | HttpClient.HttpClient>;
    readonly afterSyncRun?: () => void;
    readonly isRunWorkComplete?: () => boolean;
    readonly isRunDeferred?: () => boolean;
    readonly validateToken?: (token: string) => Effect.Effect<unknown, Schema.SchemaError>;
    readonly isRetryableError?: (error: unknown) => boolean;
    readonly isCredentialWideError?: (error: unknown) => boolean;
    readonly shouldKeepSyncsEnabledAfterError?: (error: unknown) => boolean;
}
