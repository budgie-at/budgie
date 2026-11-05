import { HouseholdShareService, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { HouseholdShareSelector } from '../household-share-account-section/household-share-account-section.selector';

interface Props {
    readonly isEnabled: boolean;
}

export const HouseholdShareEverythingRow = ({ isEnabled }: Props) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();

    const handleChange = (next: boolean) =>
        void run(
            Effect.flatMap(HouseholdShareService, householdShareService => householdShareService.setShareEverything(next)).pipe(
                toastOnFailure(t`Could not update sharing`)
            )
        );

    return (
        <GroupedListSwitchRow
            left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
            title={t`Share everything`}
            subtitle={t`Shares all your accounts with your family, including accounts you add later.`}
            value={isEnabled}
            testID={HouseholdShareSelector.EverythingRow}
            switchTestID={HouseholdShareSelector.EverythingSwitch}
            onChange={handleChange}
        />
    );
};
