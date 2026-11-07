import { HouseholdJoinStatusEnum } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { msg, plural } from '@lingui/core/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { HouseholdJoinCardSelector } from '../component/household-join-card/household-join-card.selector';
import { HouseholdMemberSummarySelector } from '../component/household-member-summary/household-member-summary.selector';

import type { HouseholdSummaryInputInterface } from '../interface/household-summary-input.interface';
import type { MessageDescriptor } from '@lingui/core';

export const getHouseholdSummaryLabels = (
    t: (message: MessageDescriptor) => string,
    { joinStatus, ownerDisplayName, organizerName, isMember, isAvailable, isReady, sharedCount }: HouseholdSummaryInputInterface
) => {
    const isJoining = joinStatus === HouseholdJoinStatusEnum.JOINING;
    if (isJoining || joinStatus === HouseholdJoinStatusEnum.FAILED) {
        const joiningTitle = isDefined(ownerDisplayName) ? t(msg`Joining ${ownerDisplayName}'s family…`) : t(msg`Joining the family…`);

        return {
            title: isJoining ? joiningTitle : t(msg`Could not join the family`),
            subtitle: isJoining ? t(msg`Accepting the invitation`) : t(msg`Open the invitation link again to retry.`),
            icon: isJoining ? UserIconNameEnum.Users : UserIconNameEnum.TriangleAlert,
            isLoading: isJoining,
            isPaused: false,
            hasSummary: true,
            testID: HouseholdJoinCardSelector.Card
        };
    }
    const sharedSubtitle = t(msg({ message: plural(sharedCount, { one: '# shared account', other: '# shared accounts' }) }));
    const readySubtitle = isPositiveNumber(sharedCount) ? sharedSubtitle : t(msg`Shared accounts stay in sync`);
    const syncSubtitle = isReady ? readySubtitle : t(msg`Syncing…`);

    return {
        title: isDefined(organizerName) ? t(msg`${organizerName}'s family`) : t(msg`Your family`),
        subtitle: isAvailable ? syncSubtitle : t(msg`Paused: sign in to iCloud`),
        icon: joinStatus === HouseholdJoinStatusEnum.JOINED ? UserIconNameEnum.CircleCheck : UserIconNameEnum.Users,
        isLoading: isAvailable && !isReady,
        isPaused: !isAvailable,
        hasSummary: isMember,
        testID: HouseholdMemberSummarySelector.Card
    };
};
