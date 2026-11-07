import { CloudSyncService, HouseholdService, SyncAutomationService } from '@budgie/cloud-sync';
import * as Layer from 'effect/Layer';

import { IS_CLOUD_BACKUP_SUPPORTED } from '../../cloud-backup/constant/is-cloud-backup-supported.constant';

import { cloudSyncDatabaseChangesLayer } from './cloud-sync-database-changes.layer';
import { cloudSyncHostLayer } from './cloud-sync-host.layer';
import { cloudSyncInstallIdLayer } from './cloud-sync-install-id.layer';
import { cloudSyncSafetyCopyLayer } from './cloud-sync-safety-copy.layer';
import { cloudSyncStateStoreLayer } from './cloud-sync-state-store.layer';
import { cloudSyncTransportLayer } from './cloud-sync-transport.layer';
import { syncAutomationEmbeddingBoostLayer } from './sync-automation-embedding-boost.layer';

const cloudSyncPortsLayer = Layer.mergeAll(
    cloudSyncTransportLayer,
    cloudSyncStateStoreLayer,
    cloudSyncSafetyCopyLayer,
    cloudSyncInstallIdLayer,
    cloudSyncDatabaseChangesLayer,
    cloudSyncHostLayer,
    SyncAutomationService.layer.pipe(Layer.provide(syncAutomationEmbeddingBoostLayer))
);

export const cloudSyncLayer = IS_CLOUD_BACKUP_SUPPORTED
    ? Layer.mergeAll(CloudSyncService.layer, HouseholdService.layer).pipe(Layer.provideMerge(cloudSyncPortsLayer))
    : Layer.empty;
