import { CloudSyncHouseholdService } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsDestructiveRow } from '../../../settings/components/settings-destructive-row/settings-destructive-row';

import { HouseholdStopSharingRowSelector } from './household-stop-sharing-row.selector';

export const HouseholdStopSharingRow = () => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();
    const [hapticNotification] = useVibration();

    const stopSharing = confirmAlert({
        title: t`Stop sharing with your family?`,
        message: t`Everyone is removed from your family group. Their shared data is deleted from their devices the next time they sync, so a device that is offline may keep it until then. You keep your data.`,
        confirmText: t`Stop sharing`,
        cancelText: t`Cancel`,
        isDestructive: true
    }).pipe(
        Effect.flatMap(isConfirmed =>
            isConfirmed
                ? Effect.flatMap(CloudSyncHouseholdService, householdService => householdService.stopHouseholdSharing()).pipe(
                      Effect.tap(() =>
                          Effect.sync(() => {
                              hapticNotification(NotificationFeedbackType.Success);
                          })
                      )
                  )
                : Effect.void
        ),
        toastOnFailure(t`Could not stop sharing`)
    );

    const handlePress = () => void run(stopSharing);

    return (
        <SettingsDestructiveRow
            icon={UserIconNameEnum.UserX}
            title={t`Stop sharing`}
            testID={HouseholdStopSharingRowSelector.Card}
            onPress={handlePress}
            subtitle={t`Removes everyone from your family group`}
            isLoading={isLoading}
        />
    );
};
