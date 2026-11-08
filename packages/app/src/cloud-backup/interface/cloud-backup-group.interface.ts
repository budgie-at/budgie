import type { CloudBackupItemInterface } from './cloud-backup-item.interface';

export interface CloudBackupGroupInterface {
    readonly installId: string;
    readonly deviceName: string;
    readonly backups: readonly CloudBackupItemInterface[];
}
