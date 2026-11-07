import { HouseholdShareService } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsSwitchRow } from '../../../settings/components/settings-switch-row/settings-switch-row';

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
        <SettingsSwitchRow
            icon={UserIconNameEnum.Wallet}
            title={account.title}
            value={account.isShared}
            isLoading={isLoading}
            testID={HouseholdAccountShareRowSelector.Row}
            switchTestID={HouseholdAccountShareRowSelector.Switch}
            {...(!isLoading && { onChange: handleChange })}
        />
    );
};
