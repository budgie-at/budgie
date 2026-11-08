import { CloudSyncHouseholdService } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { showSuccessToast } from '../../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsDestructiveRow } from '../../../settings/components/settings-destructive-row/settings-destructive-row';

import { HouseholdRemoveGroupRowSelector } from './household-remove-group-row.selector';

export const HouseholdRemoveGroupRow = () => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();
    const [hapticNotification] = useVibration();
    const removeEmptyGroup = Effect.flatMap(CloudSyncHouseholdService, householdService => householdService.removeEmptyHousehold()).pipe(
        Effect.tap(() =>
            Effect.sync(() => {
                hapticNotification();
                showSuccessToast(t`Family group removed`);
            })
        ),
        toastOnFailure(t`Could not remove the family group`)
    );
    const handlePress = () => void run(removeEmptyGroup);

    return (
        <SettingsDestructiveRow
            icon={UserIconNameEnum.UserX}
            title={t`Remove family group`}
            subtitle={t`Turns off sharing. You keep your data.`}
            testID={HouseholdRemoveGroupRowSelector.Card}
            onPress={handlePress}
            isLoading={isLoading}
        />
    );
};
