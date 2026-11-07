import * as Context from 'effect/Context';

import type * as Stream from 'effect/Stream';

export class CloudSyncDatabaseChanges extends Context.Service<CloudSyncDatabaseChanges, Stream.Stream<ReadonlyArray<string>>>()(
    '@budgie/cloud-sync/CloudSyncDatabaseChanges'
) {}
