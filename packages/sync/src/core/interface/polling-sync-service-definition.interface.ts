import type { PollingSyncError } from './polling-sync-error.type';
import type { SyncBatchResultInterface } from './sync-batch-result.interface';
import type { SyncServiceDefinitionInterface } from './sync-service-definition.interface';
import type { Db, SyncEntityInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';
import type * as HttpClient from 'effect/http/HttpClient';

export interface PollingSyncServiceDefinitionInterface extends SyncServiceDefinitionInterface {
    readonly rateLimitMs: number;
    readonly forwardSyncStaleThresholdMs?: number;
    readonly isBackwardForegroundOnly?: boolean;
    readonly shouldRequestSyncWhenEnabled?: boolean;
    readonly executeSyncBatch: (
        sync: SyncEntityInterface,
        token: string
    ) => Effect.Effect<SyncBatchResultInterface, PollingSyncError, Db | HttpClient.HttpClient>;
    readonly beforeSyncRun: (deadlineAtMs: number) => Effect.Effect<void, PollingSyncError, Db>;
    readonly beforeProcessRun?: (tokens: readonly string[]) => Effect.Effect<void, PollingSyncError, Db | HttpClient.HttpClient>;
    readonly applyProgressUpdate?: (
        sync: SyncEntityInterface,
        result: SyncBatchResultInterface
    ) => Effect.Effect<void, PollingSyncError, Db | HttpClient.HttpClient>;
    readonly afterSyncRun?: () => void;
    readonly isRunWorkComplete?: () => boolean;
    readonly isRunDeferred?: () => boolean;
    readonly isRetryableError?: (error: unknown) => boolean;
    readonly isCredentialWideError?: (error: unknown) => boolean;
    readonly shouldKeepFailedSyncEnabledAfterError?: (error: unknown) => boolean;
    readonly shouldKeepSyncsEnabledAfterError?: (error: unknown) => boolean;
}
