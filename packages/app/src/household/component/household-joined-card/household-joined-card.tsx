import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import Animated from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PRESENCE_ENTERING, PRESENCE_EXITING } from '../../../@generic/constant/presence-motion.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { SettingsRowAccessoryKindEnum } from '../../../settings/enum/settings-row-accessory-kind.enum';
import { householdAccountsOverviewAtom } from '../../constant/household-accounts-overview-atom.constant';
import { useHouseholdOrganizerName } from '../../hook/use-household-organizer-name.hook';
import { useHousehold } from '../../hook/use-household.hook';

import { HouseholdJoinedCardSelector } from './household-joined-card.selector';

export const HouseholdJoinedCard = () => {
    const { t } = useLingui();
    const organizerName = useHouseholdOrganizerName();
    const { isReady } = useHousehold();
    const overview = AsyncResult.getOrElse(useLiveAtomValue(householdAccountsOverviewAtom), () => null);

    const title = isDefined(organizerName) ? t`You've joined ${organizerName}'s family` : t`You've joined the family`;
    const sharedCount = overview?.sharedByOthersCount ?? 0;
    const sharedSubtitle = t({
        message: plural(sharedCount, { one: '# shared account', other: '# shared accounts' })
    });
    const organizerSubtitle = isPositiveNumber(sharedCount) ? t`Organizer · ${sharedSubtitle}` : t`Organizer`;
    const syncingSubtitle = isReady ? t`Shared accounts stay in sync` : t`Syncing…`;

    return (
        <Animated.View entering={PRESENCE_ENTERING} exiting={PRESENCE_EXITING}>
            <GroupedListSection>
                <SettingsRow
                    icon={UserIconNameEnum.CircleCheck}
                    variant="ghost"
                    title={title}
                    subtitle={syncingSubtitle}
                    right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={!isReady} />}
                    testID={HouseholdJoinedCardSelector.Card}
                />
                <SettingsRow
                    icon={UserIconNameEnum.Crown}
                    variant="ghost"
                    title={organizerName ?? t`Your organizer`}
                    subtitle={organizerSubtitle}
                    testID={HouseholdJoinedCardSelector.Organizer}
                />
            </GroupedListSection>
        </Animated.View>
    );
};
