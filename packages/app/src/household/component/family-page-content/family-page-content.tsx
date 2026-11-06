import { View } from 'react-native';

import { useHousehold } from '../../hook/use-household.hook';
import { HouseholdEmptyContent } from '../household-empty-content/household-empty-content';
import { HouseholdMemberContent } from '../household-member-content/household-member-content';
import { HouseholdOwnerContent } from '../household-owner-content/household-owner-content';
import { HouseholdSyncRequiredNotice } from '../household-sync-required-notice/household-sync-required-notice';

export const FamilyPageContent = () => {
    const { isOwner, isMember } = useHousehold();

    return (
        <View className="gap-y-5xl pb-5xl">
            <HouseholdSyncRequiredNotice />
            {isOwner ? <HouseholdOwnerContent /> : null}
            {isMember ? <HouseholdMemberContent /> : null}
            {isOwner || isMember ? null : <HouseholdEmptyContent />}
        </View>
    );
};
