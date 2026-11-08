import { msg } from '@lingui/core/macro';

import type { HouseholdAccountFooterInterface } from '../interface/get-household-account-footer.interface';
import type { MessageDescriptor } from '@lingui/core';

export const getHouseholdAccountFooter = (
    t: (message: MessageDescriptor) => string,
    { isShared, isAvailable, isToggleable }: HouseholdAccountFooterInterface
) => {
    const sharedFooter = isShared ? t(msg`Turn off to remove it from family devices.`) : null;
    const accountFooter = isAvailable ? sharedFooter : t(msg`Starts when you sign in to iCloud.`);
    const footer = isToggleable ? accountFooter : null;
    const sharedByEverythingReason = t(msg`Shared because you share all your accounts`);

    return { footer, sharedByEverythingReason };
};
