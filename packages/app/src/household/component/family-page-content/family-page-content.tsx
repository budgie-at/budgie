import { HouseholdJoinStatusEnum } from '@budgie/cloud-sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { householdJoinAtom } from '../../constant/household-join-atom.constant';
import { useHousehold } from '../../hook/use-household.hook';
import { HouseholdEmptyContent } from '../household-empty-content/household-empty-content';
import { HouseholdJoinCard } from '../household-join-card/household-join-card';
import { HouseholdMemberContent } from '../household-member-content/household-member-content';
import { HouseholdOwnerContent } from '../household-owner-content/household-owner-content';
import { HouseholdSyncRequiredNotice } from '../household-sync-required-notice/household-sync-required-notice';

export const FamilyPageContent = () => {
    const { isOwner, isMember } = useHousehold();
    const isJoining = useAtomValue(householdJoinAtom, ({ status }) => status === HouseholdJoinStatusEnum.JOINING);
    const isEmptyShown = !isOwner && !isMember && !isJoining;

    return (
        <LayoutAnimationConfig skipEntering skipExiting>
            <View className="gap-y-5xl pb-5xl">
                <HouseholdJoinCard />
                <HouseholdSyncRequiredNotice />
                {isOwner ? <HouseholdOwnerContent /> : null}
                {isMember ? <HouseholdMemberContent /> : null}
                {isEmptyShown ? <HouseholdEmptyContent /> : null}
            </View>
        </LayoutAnimationConfig>
    );
};
