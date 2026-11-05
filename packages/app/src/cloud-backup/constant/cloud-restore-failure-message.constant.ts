import { msg } from '@lingui/core/macro';

import { CloudRestoreFailureEnum } from '../enum/cloud-restore-failure.enum';

import type { MessageDescriptor } from '@lingui/core';

export const CLOUD_RESTORE_FAILURE_MESSAGE: Record<CloudRestoreFailureEnum, MessageDescriptor> = {
    [CloudRestoreFailureEnum.KEYCHAIN_UNAVAILABLE]: msg`Finish setting up iCloud Keychain, then try again`,
    [CloudRestoreFailureEnum.UNREADABLE]: msg`Can't be read: your iCloud encrypted data was reset after this backup was made`
};
