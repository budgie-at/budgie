import type { SyncDeferredError } from '../error/sync-deferred.error';
import type { SyncInvalidResponseError } from '../error/sync-invalid-response.error';
import type { SyncNetworkError } from '../error/sync-network.error';
import type { SyncRateLimitedError } from '../error/sync-rate-limited.error';
import type { SyncUnauthorizedError } from '../error/sync-unauthorized.error';

export type SyncError = SyncUnauthorizedError | SyncRateLimitedError | SyncDeferredError | SyncNetworkError | SyncInvalidResponseError;
