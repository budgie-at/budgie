import { CloudBackupListingStatusEnum } from '../enum/cloud-backup-listing-status.enum';

import type { CloudBackupGroupInterface } from './cloud-backup-group.interface';

export interface CloudBackupListingInterface {
    readonly groups: readonly CloudBackupGroupInterface[];
    readonly status: CloudBackupListingStatusEnum;
}
