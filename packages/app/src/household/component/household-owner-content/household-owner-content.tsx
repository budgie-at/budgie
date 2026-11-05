import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { HouseholdInviteRow } from '../household-invite-row/household-invite-row';
import { HouseholdOwnerParticipantRow } from '../household-owner-participant-row/household-owner-participant-row';
import { HouseholdStopSharingRow } from '../household-stop-sharing-row/household-stop-sharing-row';

export const HouseholdOwnerContent = () => {
    const { t } = useLingui();
    const { participants } = useHouseholdParticipants();

    return (
        <View className="gap-y-7xl">
            <SettingsGroup title={t`People in the household`}>
                {participants.map(participant => (
                    <HouseholdOwnerParticipantRow key={participant.participantId} participant={participant} />
                ))}
                <HouseholdInviteRow />
            </SettingsGroup>
            <HouseholdStopSharingRow />
        </View>
    );
};
