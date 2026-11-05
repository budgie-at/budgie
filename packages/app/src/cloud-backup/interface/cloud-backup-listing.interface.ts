import type { CloudBackupGroupInterface } from './cloud-backup-group.interface';

export interface CloudBackupListingInterface {
    readonly groups: readonly CloudBackupGroupInterface[];
    readonly isUnreadable: boolean;
}
