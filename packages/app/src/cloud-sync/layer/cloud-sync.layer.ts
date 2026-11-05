import * as Layer from 'effect/Layer';

import { IS_CLOUD_BACKUP_SUPPORTED } from '../../cloud-backup/constant/is-cloud-backup-supported.constant';
import { HouseholdService } from '../../household/service/household.service';
import { BankOwnershipService } from '../service/bank-ownership.service';
import { CloudSyncService } from '../service/cloud-sync.service';

export const cloudSyncLayer = IS_CLOUD_BACKUP_SUPPORTED
    ? Layer.mergeAll(CloudSyncService.layer, HouseholdService.layer, BankOwnershipService.installIdLayer)
    : Layer.empty;
