import * as Layer from 'effect/Layer';

import { IS_CLOUD_BACKUP_SUPPORTED } from '../constant/is-cloud-backup-supported.constant';
import { CloudBackupTriggerService } from '../service/cloud-backup-trigger.service';
import { CloudBackupService } from '../service/cloud-backup.service';
import { CloudRestoreService } from '../service/cloud-restore.service';
import { CloudTransport } from '../service/cloud-transport.service';

export const cloudBackupLayer = IS_CLOUD_BACKUP_SUPPORTED
    ? Layer.mergeAll(CloudTransport.layer, CloudBackupService.layer, CloudBackupTriggerService.layer, CloudRestoreService.layer)
    : Layer.empty;
