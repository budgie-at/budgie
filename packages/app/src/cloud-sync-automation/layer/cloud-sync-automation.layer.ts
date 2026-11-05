import * as Layer from 'effect/Layer';

import { IS_CLOUD_BACKUP_SUPPORTED } from '../../cloud-backup/constant/is-cloud-backup-supported.constant';
import { SyncAutomationService } from '../service/sync-automation.service';

import { syncAutomationEmbeddingBoostLayer } from './sync-automation-embedding-boost.layer';

export const cloudSyncAutomationLayer = IS_CLOUD_BACKUP_SUPPORTED
    ? SyncAutomationService.layer.pipe(Layer.provideMerge(syncAutomationEmbeddingBoostLayer))
    : Layer.empty;
