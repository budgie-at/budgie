import { CloudSyncDatabaseChanges } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { DatabaseChangeService } from '../../@generic/drizzle/service/database-change.service';

export const cloudSyncDatabaseChangesLayer = Layer.effect(
    CloudSyncDatabaseChanges,
    Effect.map(DatabaseChangeService, databaseChangeService => databaseChangeService.changes)
).pipe(Layer.provide(DatabaseChangeService.layer));
