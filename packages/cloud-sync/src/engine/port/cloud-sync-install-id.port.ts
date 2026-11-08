import * as Context from 'effect/Context';

import type * as Effect from 'effect/Effect';

export class CloudSyncInstallId extends Context.Service<CloudSyncInstallId, Effect.Effect<string>>()(
    '@budgie/cloud-sync/CloudSyncInstallId'
) {}
