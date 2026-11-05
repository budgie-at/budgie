import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { HouseholdService } from '../../service/household.service';

import { HouseholdStopSharingRowSelector } from './household-stop-sharing-row.selector';

export const HouseholdStopSharingRow = () => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();

    const handlePress = () => {
        void run(
            confirmAlert({
                title: t`Stop sharing with everyone?`,
                message: t`Everyone is removed from the household. Their shared data is deleted from their devices the next time they sync, so a device that is offline may keep it until then. You keep your data.`,
                confirmText: t`Stop sharing`,
                cancelText: t`Cancel`,
                isDestructive: true
            }).pipe(
                Effect.flatMap(isConfirmed =>
                    isConfirmed ? Effect.flatMap(HouseholdService, householdService => householdService.stopSharing()) : Effect.void
                ),
                toastOnFailure(t`Could not stop sharing`)
            )
        );
    };

    return (
        <SettingsRow
            icon={UserIconNameEnum.UserX}
            variant="destructive"
            title={t`Stop sharing`}
            testID={HouseholdStopSharingRowSelector.Card}
            onPress={handlePress}
            subtitle={
                <LoadingContent isLoading={isLoading}>
                    <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={3}>
                        {t`Removing is best effort: devices that are offline keep the data until they sync.`}
                    </Text>
                </LoadingContent>
            }
        />
    );
};
