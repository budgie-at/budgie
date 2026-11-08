import * as Context from 'effect/Context';

import type { CloudSyncStateInterface } from '../interface/cloud-sync-state.interface';
import type * as Effect from 'effect/Effect';

export class CloudSyncStateStore extends Context.Service<
    CloudSyncStateStore,
    {
        readonly read: Effect.Effect<CloudSyncStateInterface>;
        readonly update: (patch: Partial<CloudSyncStateInterface>) => Effect.Effect<void>;
        readonly clear: Effect.Effect<void>;
    }
>()('@budgie/cloud-sync/CloudSyncStateStore') {}
