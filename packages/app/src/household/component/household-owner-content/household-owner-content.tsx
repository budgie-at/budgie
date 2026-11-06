import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { HouseholdInviteRow } from '../household-invite-row/household-invite-row';
import { HouseholdOwnerParticipantRow } from '../household-owner-participant-row/household-owner-participant-row';
import { HouseholdParticipantsGroup } from '../household-participants-group/household-participants-group';
import { HouseholdShareEverythingSection } from '../household-share-everything-section/household-share-everything-section';
import { HouseholdStopSharingRow } from '../household-stop-sharing-row/household-stop-sharing-row';
import { HouseholdYouRow } from '../household-you-row/household-you-row';

export const HouseholdOwnerContent = () => {
    const { t } = useLingui();
    const { otherParticipants, isLoading, isKnown } = useHouseholdParticipants();
    const { isAvailable } = useICloudAccount();

    const isEmptyGroup = isEmptyArray(otherParticipants) && (isKnown || !isAvailable);
    const isStopSharingShown = isAvailable || isEmptyGroup;
    const peopleFooter = isEmptyArray(otherParticipants) ? null : t`Family members can see and edit what you share.`;

    return (
        <View className="gap-y-5xl">
            <GroupedListSection title={t`People`} footer={peopleFooter}>
                <HouseholdYouRow icon={UserIconNameEnum.Crown} subtitle={t`Organizer`} />
                <HouseholdParticipantsGroup isLoading={isLoading} isEmpty={isEmptyArray(otherParticipants)}>
                    {otherParticipants.map(participant => (
                        <HouseholdOwnerParticipantRow key={participant.participantId} participant={participant} />
                    ))}
                </HouseholdParticipantsGroup>
                <HouseholdInviteRow />
            </GroupedListSection>
            <HouseholdShareEverythingSection />
            {isStopSharingShown ? (
                <GroupedListSection>
                    <HouseholdStopSharingRow isEmptyGroup={isEmptyGroup} />
                </GroupedListSection>
            ) : null}
        </View>
    );
};
