import { View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { HouseholdMemberJoinWatcher } from '../household-member-join-watcher/household-member-join-watcher';
import { HouseholdPeopleSection } from '../household-people-section/household-people-section';
import { HouseholdShareSection } from '../household-share-section/household-share-section';
import { HouseholdStopSharingRow } from '../household-stop-sharing-row/household-stop-sharing-row';

export const HouseholdOwnerContent = () => {
    const { otherParticipants, isKnown } = useHouseholdParticipants();
    const { isAvailable } = useICloudAccount();

    const isEmptyGroup = isEmptyArray(otherParticipants) && (isKnown || !isAvailable);
    const isStopSharingShown = isAvailable || isEmptyGroup;

    return (
        <View className="gap-y-5xl">
            <HouseholdMemberJoinWatcher />
            <HouseholdPeopleSection />
            <HouseholdShareSection />
            {isStopSharingShown ? (
                <GroupedListSection>
                    <HouseholdStopSharingRow isEmptyGroup={isEmptyGroup} />
                </GroupedListSection>
            ) : null}
        </View>
    );
};
