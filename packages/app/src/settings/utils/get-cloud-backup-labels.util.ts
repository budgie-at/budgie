import { msg } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import type { MessageDescriptor } from '@lingui/core';

export const getCloudBackupLabels = (
    t: (message: MessageDescriptor) => string,
    lastBackupAt: Date | null,
    formatBackupDate: (date: Date) => string,
    isAccountUnavailable: boolean
) => {
    const lastBackupDate = isDefined(lastBackupAt) ? formatBackupDate(lastBackupAt) : '';
    const readyLabel = isDefined(lastBackupAt) ? t(msg`Last iCloud backup: ${lastBackupDate}`) : t(msg`Not backed up to iCloud yet`);
    const offLabel = isAccountUnavailable ? t(msg`Sign in to iCloud to turn on`) : t(msg`Turned off`);

    return { readyLabel, offLabel };
};
