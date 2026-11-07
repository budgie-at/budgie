import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { SettingsRowAccessoryKindEnum } from '../../../settings/enum/settings-row-accessory-kind.enum';
import { householdAccountsOverviewAtom } from '../../constant/household-accounts-overview-atom.constant';
import { householdJoinAtom } from '../../constant/household-join-atom.constant';
import { HouseholdJoinStatusEnum } from '../../enum/household-join-status.enum';
import { useHouseholdOrganizerName } from '../../hook/use-household-organizer-name.hook';
import { useHousehold } from '../../hook/use-household.hook';

import { HouseholdMemberSummarySelector } from './household-member-summary.selector';

export const HouseholdMemberSummary = () => {
    const { t } = useLingui();
    const organizerName = useHouseholdOrganizerName();
    const { isReady } = useHousehold();
    const isJustJoined = useAtomValue(householdJoinAtom, ({ status }) => status === HouseholdJoinStatusEnum.JOINED);
    const overview = AsyncResult.getOrElse(useLiveAtomValue(householdAccountsOverviewAtom), () => null);

    const title = isDefined(organizerName) ? t`${organizerName}'s family` : t`Your family`;
    const icon = isJustJoined ? UserIconNameEnum.CircleCheck : UserIconNameEnum.Users;
    const sharedCount = overview?.sharedByOthersCount ?? 0;
    const sharedSubtitle = t({
        message: plural(sharedCount, { one: '# shared account', other: '# shared accounts' })
    });
    const readySubtitle = isPositiveNumber(sharedCount) ? sharedSubtitle : t`Shared accounts stay in sync`;
    const subtitle = isReady ? readySubtitle : t`Syncing…`;

    return (
        <GroupedListSection>
            <SettingsRow
                icon={icon}
                variant="ghost"
                title={title}
                subtitle={subtitle}
                right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={!isReady} />}
                testID={HouseholdMemberSummarySelector.Card}
            />
        </GroupedListSection>
    );
};
