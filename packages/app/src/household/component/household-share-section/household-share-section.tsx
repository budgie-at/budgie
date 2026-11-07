import { HouseholdShareService } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import Animated from 'react-native-reanimated';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { PRESENCE_ENTERING, PRESENCE_EXITING } from '../../../@generic/constant/presence-motion.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { SettingsRowIcon } from '../../../settings/components/settings-row-icon/settings-row-icon';
import { householdShareEverythingAtom } from '../../constant/household-share-everything-atom.constant';
import { useHouseholdOrganizerName } from '../../hook/use-household-organizer-name.hook';
import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { useHousehold } from '../../hook/use-household.hook';
import { getHouseholdShareLabels } from '../../utils/get-household-share-labels.util';
import { HouseholdAccountShareList } from '../household-account-share-list/household-account-share-list';

import { HouseholdShareEverythingSectionSelector } from './household-share-section.selector';

export const HouseholdShareSection = () => {
    const { t } = useLingui();
    const everything = AsyncResult.getOrElse(useLiveAtomValue(householdShareEverythingAtom), () => null);
    const { run, isLoading } = useSingleFlight();
    const { isAvailable } = useICloudAccount();
    const { isMember } = useHousehold();
    const organizerName = useHouseholdOrganizerName();
    const { joinedMembers } = useHouseholdParticipants();

    if (!isDefined(everything) || !everything.isAvailable) {
        return null;
    }

    const handleChange = (next: boolean) =>
        void run(
            Effect.flatMap(HouseholdShareService, householdShareService => householdShareService.setShareEverything(next)).pipe(
                toastOnFailure(t`Could not update sharing`)
            )
        );

    const hasJoinedMember = isNotEmptyArray(joinedMembers);
    const isChoosing = isMember || hasJoinedMember;
    const { title, footer } = getHouseholdShareLabels(t, { isAvailable, isMember, organizerName, hasJoinedMember });

    return (
        <Animated.View entering={PRESENCE_ENTERING} exiting={PRESENCE_EXITING}>
            <GroupedListSection title={title} footer={footer}>
                <GroupedListSwitchRow
                    left={<SettingsRowIcon icon={UserIconNameEnum.Layers} variant="ghost" />}
                    title={t`Share everything`}
                    subtitle={t`Family can edit every account`}
                    value={everything.isEnabled}
                    isLoading={isLoading}
                    testID={HouseholdShareEverythingSectionSelector.Row}
                    switchTestID={HouseholdShareEverythingSectionSelector.Switch}
                    {...(!isLoading && { onChange: handleChange })}
                />
                {isChoosing ? <HouseholdAccountShareList /> : null}
            </GroupedListSection>
        </Animated.View>
    );
};
