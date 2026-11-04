import * as Context from 'effect/Context';

import type { SyncDeferredError } from '../error/sync-deferred.error';
import type { SyncUnauthorizedError } from '../error/sync-unauthorized.error';
import type { Db } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export class SyncRequestSigner extends Context.Service<
    SyncRequestSigner,
    {
        readonly sign: (keyId: string, signingInput: string) => Effect.Effect<string, SyncUnauthorizedError | SyncDeferredError>;
        readonly deleteKey: (keyId: string) => Effect.Effect<void, SyncDeferredError>;
        readonly generateState: Effect.Effect<string, never, Db>;
    }
>()('@budgie/sync/SyncRequestSigner') {}
