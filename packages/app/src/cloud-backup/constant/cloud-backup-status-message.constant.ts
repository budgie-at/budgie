import { msg } from '@lingui/core/macro';

import { CloudBackupStatusEnum } from '../enum/cloud-backup-status.enum';

import type { MessageDescriptor } from '@lingui/core';

export const CLOUD_BACKUP_STATUS_MESSAGE: Record<Exclude<CloudBackupStatusEnum, CloudBackupStatusEnum.READY>, MessageDescriptor> = {
    [CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE]: msg`Sign in to iCloud to turn on`,
    [CloudBackupStatusEnum.STORAGE_FULL]: msg`iCloud storage full`,
    [CloudBackupStatusEnum.NETWORK_UNAVAILABLE]: msg`Waiting for network`
};
