import { msg } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import type { HouseholdAccountFooterInterface } from '../interface/get-household-account-footer.interface';
import type { MessageDescriptor } from '@lingui/core';

export const getHouseholdAccountFooter = (
    t: (message: MessageDescriptor) => string,
    { isShared, isAvailable, isToggleable, isSyncedByOther, ownerName }: HouseholdAccountFooterInterface
) => {
    const sharedFooter = isShared ? t(msg`Turn off to remove it from family devices.`) : null;
    const accountFooter = isAvailable ? sharedFooter : t(msg`Starts when you sign in to iCloud.`);
    const ownFooter = isToggleable ? accountFooter : null;
    const sharedByEverythingReason = t(msg`Shared because you share everything`);
    const footer = isSyncedByOther && isDefined(ownerName) ? t(msg`Synced by ${ownerName}`) : ownFooter;

    return { footer, sharedByEverythingReason };
};
