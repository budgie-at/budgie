import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { HouseholdLeaveRow } from '../household-leave-row/household-leave-row';
import { HouseholdParticipantRow } from '../household-participant-row/household-participant-row';

export const HouseholdMemberContent = () => {
    const { t } = useLingui();
    const { participants, ownerName } = useHouseholdParticipants();
    const owner = ownerName ?? t`the owner`;

    return (
        <View className="gap-y-7xl">
            <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
                <Trans>You are in the household of {owner}. Shared accounts appear next to your own and everyone in the household can edit them.</Trans>
            </Text>
            <SettingsGroup title={t`People in the household`}>
                {participants.map(participant => (
                    <HouseholdParticipantRow key={participant.participantId} participant={participant} />
                ))}
            </SettingsGroup>
            <HouseholdLeaveRow />
        </View>
    );
};
