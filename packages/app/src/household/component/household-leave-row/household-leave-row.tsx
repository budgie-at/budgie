import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsDestructiveRow } from '../../../settings/components/settings-destructive-row/settings-destructive-row';
import { HouseholdService } from '../../service/household.service';

import { HouseholdLeaveRowSelector } from './household-leave-row.selector';

export const HouseholdLeaveRow = () => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();

    const handlePress = () => {
        void run(
            confirmAlert({
                title: t`Leave this family?`,
                message: t`You keep a copy of the shared data in your own accounts on this device. Later changes by your family no longer reach you.`,
                confirmText: t`Leave`,
                cancelText: t`Cancel`,
                isDestructive: true
            }).pipe(
                Effect.flatMap(isConfirmed =>
                    isConfirmed ? Effect.flatMap(HouseholdService, householdService => householdService.leave) : Effect.void
                ),
                toastOnFailure(t`Could not leave the family`)
            )
        );
    };

    return (
        <SettingsDestructiveRow
            icon={UserIconNameEnum.LogOut}
            title={t`Leave family`}
            testID={HouseholdLeaveRowSelector.Card}
            onPress={handlePress}
            subtitle={t`You keep a copy of the shared data`}
            isLoading={isLoading}
        />
    );
};
