import { msg } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import type { HouseholdShareLabelsInterface } from '../interface/get-household-share-labels.interface';
import type { MessageDescriptor } from '@lingui/core';

export const getHouseholdShareLabels = (
    t: (message: MessageDescriptor) => string,
    { isAvailable, isMember, organizerName, hasJoinedMember }: HouseholdShareLabelsInterface
) => {
    const soloFooter = isAvailable
        ? t(msg`Includes accounts you add later.`)
        : t(msg`Includes accounts you add later. Starts when you sign in to iCloud.`);
    const familyFooter = t(msg`Your family can see and edit the accounts you share. Sharing all includes accounts you add later.`);
    const memberTitle = isDefined(organizerName) ? t(msg`Share your accounts with ${organizerName}`) : t(msg`Share your accounts`);
    const ownerTitle = hasJoinedMember ? t(msg`Choose what to share`) : t(msg`Sharing`);
    const title = isMember ? memberTitle : ownerTitle;
    const footer = isMember || hasJoinedMember ? familyFooter : soloFooter;

    return { title, footer };
};
