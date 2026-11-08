import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HouseholdLeaveRow } from '../household-leave-row/household-leave-row';
import { HouseholdPeopleSection } from '../household-people-section/household-people-section';
import { HouseholdShareSection } from '../household-share-section/household-share-section';

export const HouseholdMemberContent = () => (
    <View className="gap-y-5xl">
        <HouseholdPeopleSection />
        <HouseholdShareSection />
        <GroupedListSection>
            <HouseholdLeaveRow />
        </GroupedListSection>
    </View>
);
