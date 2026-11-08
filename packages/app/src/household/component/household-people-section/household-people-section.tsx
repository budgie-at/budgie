import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useHouseholdOrganizerName } from '../../hook/use-household-organizer-name.hook';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { useHousehold } from '../../hook/use-household.hook';
import { HouseholdInviteRow } from '../household-invite-row/household-invite-row';
import { HouseholdOwnerParticipantRow } from '../household-owner-participant-row/household-owner-participant-row';
import { HouseholdParticipantRow } from '../household-participant-row/household-participant-row';
import { HouseholdParticipantsGroup } from '../household-participants-group/household-participants-group';
import { HouseholdPendingInvitesRow } from '../household-pending-invites-row/household-pending-invites-row';

import { HouseholdOrganizerRowSelector } from './household-organizer-row.selector';
import { HouseholdYouRowSelector } from './household-you-row.selector';

export const HouseholdPeopleSection = () => {
    const { t } = useLingui();
    const { isOwner } = useHousehold();
    const { otherParticipants, members, identified, pendingInvites, isLoading } = useHouseholdParticipants();
    const organizerName = useHouseholdOrganizerName();

    const footer = isEmptyArray(otherParticipants) ? null : t`Family members can see and edit what you share.`;
    const youIcon = isOwner ? UserIconNameEnum.Crown : UserIconNameEnum.UserRound;
    const youSubtitle = isOwner ? t`Organizer` : t`Member`;
    const organizerSubtitle = isDefined(organizerName) ? t`Organizer` : null;
    const youRow = (
        <SettingsRow icon={youIcon} variant="ghost" title={t`You`} subtitle={youSubtitle} testID={HouseholdYouRowSelector.Card} />
    );

    if (isOwner) {
        return (
            <GroupedListSection title={t`People`} footer={footer}>
                {youRow}
                <HouseholdParticipantsGroup isLoading={isLoading} isEmpty={isEmptyArray(otherParticipants)}>
                    {identified.map(participant => (
                        <HouseholdOwnerParticipantRow key={participant.participantId} participant={participant} />
                    ))}
                    <HouseholdPendingInvitesRow participants={pendingInvites} />
                </HouseholdParticipantsGroup>
                <HouseholdInviteRow />
            </GroupedListSection>
        );
    }

    return (
        <GroupedListSection title={t`People`} footer={footer}>
            <SettingsRow
                icon={UserIconNameEnum.Crown}
                variant="ghost"
                title={organizerName ?? t`Organizer`}
                subtitle={organizerSubtitle}
                testID={HouseholdOrganizerRowSelector.Card}
            />
            {youRow}
            {members.map(participant => (
                <HouseholdParticipantRow key={participant.participantId} participant={participant} />
            ))}
        </GroupedListSection>
    );
};
