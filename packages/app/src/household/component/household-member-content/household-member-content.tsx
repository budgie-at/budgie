import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { ICloudParticipantRole } from '../../../../modules/icloud';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { HouseholdLeaveRow } from '../household-leave-row/household-leave-row';
import { HouseholdMemberShareSection } from '../household-member-share-section/household-member-share-section';
import { HouseholdMemberSummary } from '../household-member-summary/household-member-summary';
import { HouseholdOrganizerRow } from '../household-organizer-row/household-organizer-row';
import { HouseholdParticipantRow } from '../household-participant-row/household-participant-row';
import { HouseholdYouRow } from '../household-you-row/household-you-row';

export const HouseholdMemberContent = () => {
    const { t } = useLingui();
    const { otherParticipants } = useHouseholdParticipants();
    const members = otherParticipants.filter(participant => participant.role !== ICloudParticipantRole.OWNER);
    const peopleFooter = isEmptyArray(otherParticipants) ? null : t`Family members can see and edit what you share.`;

    return (
        <View className="gap-y-5xl">
            <HouseholdMemberSummary />
            <GroupedListSection title={t`People`} footer={peopleFooter}>
                <HouseholdOrganizerRow />
                <HouseholdYouRow icon={UserIconNameEnum.UserRound} subtitle={t`Member`} />
                {members.map(participant => (
                    <HouseholdParticipantRow key={participant.participantId} participant={participant} />
                ))}
            </GroupedListSection>
            <HouseholdMemberShareSection />
            <GroupedListSection>
                <HouseholdLeaveRow />
            </GroupedListSection>
        </View>
    );
};
