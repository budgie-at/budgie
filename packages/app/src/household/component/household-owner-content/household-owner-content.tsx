import { ICloudParticipantAcceptanceStatus, ICloudParticipantRole } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { HouseholdInviteRow } from '../household-invite-row/household-invite-row';
import { HouseholdMemberJoinWatcher } from '../household-member-join-watcher/household-member-join-watcher';
import { HouseholdOwnerParticipantRow } from '../household-owner-participant-row/household-owner-participant-row';
import { HouseholdOwnerShareSection } from '../household-owner-share-section/household-owner-share-section';
import { HouseholdParticipantsGroup } from '../household-participants-group/household-participants-group';
import { HouseholdPendingInvitesRow } from '../household-pending-invites-row/household-pending-invites-row';
import { HouseholdStopSharingRow } from '../household-stop-sharing-row/household-stop-sharing-row';
import { HouseholdYouRow } from '../household-you-row/household-you-row';

import type { ICloudShareParticipant } from '@budgie/cloud-sync';

export const HouseholdOwnerContent = () => {
    const { t } = useLingui();
    const { otherParticipants, isLoading, isKnown } = useHouseholdParticipants();
    const { isAvailable } = useICloudAccount();

    const isEmptyGroup = isEmptyArray(otherParticipants) && (isKnown || !isAvailable);
    const isStopSharingShown = isAvailable || isEmptyGroup;
    const isPendingInvite = (participant: ICloudShareParticipant) =>
        participant.role !== ICloudParticipantRole.OWNER &&
        participant.acceptanceStatus === ICloudParticipantAcceptanceStatus.PENDING &&
        !isNotEmptyString(participant.displayName);
    const pendingInvites = otherParticipants.filter(isPendingInvite);
    const identifiedParticipants = otherParticipants.filter(participant => !isPendingInvite(participant));
    const peopleFooter = isEmptyArray(otherParticipants) ? null : t`Family members can see and edit what you share.`;

    return (
        <View className="gap-y-5xl">
            <HouseholdMemberJoinWatcher />
            <GroupedListSection title={t`People`} footer={peopleFooter}>
                <HouseholdYouRow icon={UserIconNameEnum.Crown} subtitle={t`Organizer`} />
                <HouseholdParticipantsGroup isLoading={isLoading} isEmpty={isEmptyArray(otherParticipants)}>
                    {identifiedParticipants.map(participant => (
                        <HouseholdOwnerParticipantRow key={participant.participantId} participant={participant} />
                    ))}
                    <HouseholdPendingInvitesRow participants={pendingInvites} />
                </HouseholdParticipantsGroup>
                <HouseholdInviteRow />
            </GroupedListSection>
            <HouseholdOwnerShareSection />
            {isStopSharingShown ? (
                <GroupedListSection>
                    <HouseholdStopSharingRow isEmptyGroup={isEmptyGroup} />
                </GroupedListSection>
            ) : null}
        </View>
    );
};
