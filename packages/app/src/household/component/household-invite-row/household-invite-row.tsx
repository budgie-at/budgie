import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { HouseholdService } from '../../service/household.service';

import { HouseholdInviteRowSelector } from './household-invite-row.selector';

export const HouseholdInviteRow = () => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();

    const handlePress = () => {
        void run(
            Effect.flatMap(HouseholdService, householdService => householdService.invite()).pipe(
                toastOnFailure(t`Could not start the invitation`)
            )
        );
    };

    return (
        <SettingsRow
            icon={UserIconNameEnum.UserPlus}
            variant="ghost"
            title={t`Invite family`}
            testID={HouseholdInviteRowSelector.Card}
            onPress={handlePress}
            subtitle={
                <LoadingContent isLoading={isLoading}>
                    <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={2}>
                        {t`Send an invitation with Messages`}
                    </Text>
                </LoadingContent>
            }
        />
    );
};
