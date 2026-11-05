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

import { HouseholdLeaveRowSelector } from './household-leave-row.selector';

export const HouseholdLeaveRow = () => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();

    const handlePress = () => {
        void run(
            confirmAlert({
                title: t`Leave this household?`,
                message: t`You keep a copy of the shared data in your own accounts on this device. Later changes by the household no longer reach you.`,
                confirmText: t`Leave`,
                cancelText: t`Cancel`,
                isDestructive: true
            }).pipe(
                Effect.flatMap(isConfirmed =>
                    isConfirmed ? Effect.flatMap(HouseholdService, householdService => householdService.leave()) : Effect.void
                ),
                toastOnFailure(t`Could not leave the household`)
            )
        );
    };

    return (
        <SettingsRow
            icon={UserIconNameEnum.LogOut}
            variant="destructive"
            title={t`Leave household`}
            testID={HouseholdLeaveRowSelector.Card}
            onPress={handlePress}
            subtitle={
                <LoadingContent isLoading={isLoading}>
                    <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={2}>
                        {t`You keep a copy of the shared data`}
                    </Text>
                </LoadingContent>
            }
        />
    );
};
