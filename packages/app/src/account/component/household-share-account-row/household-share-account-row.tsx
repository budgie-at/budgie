import { HouseholdShareService, HouseholdShareStateEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { HouseholdShareSelector } from '../household-share-account-section/household-share-account-section.selector';

interface Props {
    readonly accountId: number;
    readonly state: HouseholdShareStateEnum;
}

export const HouseholdShareAccountRow = ({ accountId, state }: Props) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();

    const handleChange = (next: boolean) =>
        void run(
            Effect.flatMap(HouseholdShareService, householdShareService =>
                next ? householdShareService.shareAccount(accountId) : householdShareService.unshareAccount(accountId)
            ).pipe(toastOnFailure(t`Could not update sharing`))
        );

    if (state === HouseholdShareStateEnum.SHARED_BY_OTHER) {
        return (
            <GroupedListRow
                left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
                title={t`Shared with your family`}
                subtitle={t`A family member shares this account, so everyone in the family sees it.`}
                testID={HouseholdShareSelector.AccountRow}
            />
        );
    }

    return (
        <GroupedListSwitchRow
            left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
            title={t`Share with family`}
            subtitle={t`Everyone in your family sees this account and its transactions.`}
            value={state === HouseholdShareStateEnum.SHARED_BY_ME}
            testID={HouseholdShareSelector.AccountRow}
            switchTestID={HouseholdShareSelector.AccountSwitch}
            onChange={handleChange}
        />
    );
};
