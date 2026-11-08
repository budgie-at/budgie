import { msg } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import type { HouseholdShareLabelsInterface } from '../interface/get-household-share-labels.interface';
import type { MessageDescriptor } from '@lingui/core';

export const getHouseholdShareLabels = (
    t: (message: MessageDescriptor) => string,
    { isAvailable, isMember, organizerName, hasJoinedMember }: HouseholdShareLabelsInterface
) => {
    const defaultFooter = isAvailable
        ? t(msg`Includes accounts you add later.`)
        : t(msg`Includes accounts you add later. Starts when you sign in to iCloud.`);
    const memberTitle = isDefined(organizerName) ? t(msg`Share your accounts with ${organizerName}`) : t(msg`Share your accounts`);
    const memberScopeFooter = isDefined(organizerName)
        ? t(msg`${organizerName} sees shared accounts and their payments. Money moved between shared accounts shows as a transfer.`)
        : t(msg`The organizer sees shared accounts and their payments. Money moved between shared accounts shows as a transfer.`);
    const memberFooter = isAvailable ? memberScopeFooter : `${memberScopeFooter} ${t(msg`Starts when you sign in to iCloud.`)}`;
    const ownerTitle = hasJoinedMember ? t(msg`Choose what to share`) : t(msg`Sharing`);
    const ownerFooter = hasJoinedMember
        ? t(msg`Your family sees shared accounts and their payments. Money moved between shared accounts shows as a transfer.`)
        : defaultFooter;
    const title = isMember ? memberTitle : ownerTitle;
    const footer = isMember ? memberFooter : ownerFooter;

    return { title, footer };
};
