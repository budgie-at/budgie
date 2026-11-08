import { plural, msg } from '@lingui/core/macro';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { MessageDescriptor } from '@lingui/core';

export const getFamilyLabels = (
    t: (message: MessageDescriptor) => string,
    otherParticipants: readonly unknown[],
    joinedMembers: readonly unknown[],
    organizerName: string | null
) => {
    const pendingSubtitle = t(
        msg({
            message: plural(otherParticipants.length - joinedMembers.length, {
                one: 'Waiting for # person to join',
                other: 'Waiting for # people to join'
            })
        })
    );
    const acceptedSubtitle = t(
        msg({
            message: plural(joinedMembers.length, { one: 'Shared with # person', other: 'Shared with # people' })
        })
    );
    const sharedSubtitle = isNotEmptyArray(joinedMembers) ? acceptedSubtitle : pendingSubtitle;
    const memberSubtitle = isNotEmptyString(organizerName) ? t(msg`${organizerName}'s family`) : t(msg`Shared with your family`);

    return { sharedSubtitle, memberSubtitle };
};
