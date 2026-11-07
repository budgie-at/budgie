import { HouseholdShareService } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRowIcon } from '../../../settings/components/settings-row-icon/settings-row-icon';

import { HouseholdAccountShareRowSelector } from './household-account-share-row.selector';

import type { HouseholdAccountShareEntryInterface } from '../../interface/household-account-share-entry.interface';

interface Props {
    readonly account: HouseholdAccountShareEntryInterface;
}

export const HouseholdAccountShareRow = ({ account }: Props) => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();

    const handleChange = (next: boolean) =>
        void run(
            Effect.flatMap(HouseholdShareService, householdShareService =>
                next ? householdShareService.shareAccount(account.id) : householdShareService.unshareAccount(account.id)
            ).pipe(toastOnFailure(t`Could not update sharing`))
        );

    return (
        <GroupedListSwitchRow
            left={<SettingsRowIcon icon={UserIconNameEnum.Wallet} variant="ghost" />}
            title={account.title}
            value={account.isShared}
            isLoading={isLoading}
            testID={HouseholdAccountShareRowSelector.Row}
            switchTestID={HouseholdAccountShareRowSelector.Switch}
            {...(!isLoading && { onChange: handleChange })}
        />
    );
};
