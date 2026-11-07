import { CloudSyncHouseholdService } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { showSuccessToast } from '../../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsDestructiveRow } from '../../../settings/components/settings-destructive-row/settings-destructive-row';

import { HouseholdStopSharingRowSelector } from './household-stop-sharing-row.selector';

interface Props {
    readonly isEmptyGroup: boolean;
}

export const HouseholdStopSharingRow = ({ isEmptyGroup }: Props) => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();
    const [hapticNotification] = useVibration();

    const removeEmptyGroup = Effect.flatMap(CloudSyncHouseholdService, householdService => householdService.removeEmptyHousehold()).pipe(
        Effect.tap(() =>
            Effect.sync(() => {
                hapticNotification(NotificationFeedbackType.Success);
                showSuccessToast(t`Family group removed`);
            })
        ),
        toastOnFailure(t`Could not remove the family group`)
    );
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

    const handlePress = () => void (isEmptyGroup ? run(removeEmptyGroup) : run(stopSharing));

    const title = isEmptyGroup ? t`Remove family group` : t`Stop sharing`;
    const subtitle = isEmptyGroup ? t`Turns off sharing. You keep your data.` : t`Removes everyone from your family group`;

    return (
        <SettingsDestructiveRow
            icon={UserIconNameEnum.UserX}
            title={title}
            testID={HouseholdStopSharingRowSelector.Card}
            onPress={handlePress}
            subtitle={subtitle}
            isLoading={isLoading}
        />
    );
};
