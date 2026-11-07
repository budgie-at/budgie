import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PRESENCE_ENTERING, PRESENCE_EXITING } from '../../../@generic/constant/presence-motion.constant';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { SettingsRowAccessoryKindEnum } from '../../../settings/enum/settings-row-accessory-kind.enum';
import { householdJoinAtom } from '../../constant/household-join-atom.constant';
import { HouseholdJoinStatusEnum } from '../../enum/household-join-status.enum';

import { HouseholdJoinCardSelector } from './household-join-card.selector';

export const HouseholdJoinCard = () => {
    const { t } = useLingui();
    const { status, ownerDisplayName } = useAtomValue(householdJoinAtom);

    if (status === HouseholdJoinStatusEnum.NONE || status === HouseholdJoinStatusEnum.JOINED) {
        return null;
    }

    const isJoining = status === HouseholdJoinStatusEnum.JOINING;
    const joiningTitle = isDefined(ownerDisplayName) ? t`Joining ${ownerDisplayName}'s family…` : t`Joining the family…`;
    const title = isJoining ? joiningTitle : t`Could not join the family`;
    const subtitle = isJoining ? t`Accepting the invitation` : t`Open the invitation link again to retry.`;
    const icon = isJoining ? UserIconNameEnum.Users : UserIconNameEnum.TriangleAlert;

    return (
        <Animated.View entering={PRESENCE_ENTERING} exiting={PRESENCE_EXITING}>
            <GroupedListSection>
                <SettingsRow
                    icon={icon}
                    variant="ghost"
                    title={title}
                    subtitle={subtitle}
                    right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={isJoining} />}
                    testID={HouseholdJoinCardSelector.Card}
                />
            </GroupedListSection>
        </Animated.View>
    );
};
