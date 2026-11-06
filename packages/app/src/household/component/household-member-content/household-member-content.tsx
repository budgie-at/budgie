import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { ICloudParticipantRole } from '../../../../modules/icloud';
import { HouseholdLeaveRow } from '../household-leave-row/household-leave-row';
import { HouseholdParticipantRow } from '../household-participant-row/household-participant-row';
import { HouseholdParticipantsGroup } from '../household-participants-group/household-participants-group';
import { HouseholdShareEverythingSection } from '../household-share-everything-section/household-share-everything-section';
import { HouseholdYouRow } from '../household-you-row/household-you-row';

export const HouseholdMemberContent = () => {
    const { t } = useLingui();
    const { otherParticipants, isLoading } = useHouseholdParticipants();
    const owners = otherParticipants.filter(participant => participant.role === ICloudParticipantRole.OWNER);
    const members = otherParticipants.filter(participant => participant.role !== ICloudParticipantRole.OWNER);
    const peopleFooter = isEmptyArray(otherParticipants) ? null : t`Family members can see and edit what you share.`;

    return (
        <View className="gap-y-5xl">
            <GroupedListSection title={t`People`} footer={peopleFooter}>
                <HouseholdParticipantsGroup isLoading={isLoading} isEmpty={isEmptyArray(owners)}>
                    {owners.map(participant => (
                        <HouseholdParticipantRow key={participant.participantId} participant={participant} />
                    ))}
                </HouseholdParticipantsGroup>
                <HouseholdYouRow icon={UserIconNameEnum.UserRound} subtitle={t`Member`} />
                {members.map(participant => (
                    <HouseholdParticipantRow key={participant.participantId} participant={participant} />
                ))}
            </GroupedListSection>
            <HouseholdShareEverythingSection />
            <GroupedListSection>
                <HouseholdLeaveRow />
            </GroupedListSection>
        </View>
    );
};
