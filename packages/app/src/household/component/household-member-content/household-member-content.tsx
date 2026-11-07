import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HouseholdLeaveRow } from '../household-leave-row/household-leave-row';
import { HouseholdMemberSummary } from '../household-member-summary/household-member-summary';
import { HouseholdPeopleSection } from '../household-people-section/household-people-section';
import { HouseholdShareSection } from '../household-share-section/household-share-section';

export const HouseholdMemberContent = () => (
    <View className="gap-y-5xl">
        <HouseholdMemberSummary />
        <HouseholdPeopleSection />
        <HouseholdShareSection />
        <GroupedListSection>
            <HouseholdLeaveRow />
        </GroupedListSection>
    </View>
);
