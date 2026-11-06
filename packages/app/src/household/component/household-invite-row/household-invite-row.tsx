import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { SettingsDisabledRow } from '../../../settings/components/settings-disabled-row/settings-disabled-row';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { SettingsRowAccessoryKindEnum } from '../../../settings/enum/settings-row-accessory-kind.enum';
import { HouseholdService } from '../../service/household.service';

import { HouseholdInviteRowSelector } from './household-invite-row.selector';

export const HouseholdInviteRow = () => {
    const { t } = useLingui();
    const { isAvailable } = useICloudAccount();
    const { run, isLoading } = useSingleFlight();

    const handlePress = () => {
        void run(
            Effect.flatMap(HouseholdService, householdService => householdService.invite()).pipe(
                toastOnFailure(t`Could not start the invitation`)
            )
        );
    };

    if (!isAvailable) {
        return (
            <SettingsDisabledRow
                icon={UserIconNameEnum.UserPlus}
                title={t`Invite family`}
                subtitle={t`Sign in to iCloud to invite`}
                testID={HouseholdInviteRowSelector.Card}
            />
        );
    }

    return (
        <SettingsRow
            icon={UserIconNameEnum.UserPlus}
            variant="ghost"
            title={t`Invite family`}
            subtitle={t`Send an invitation with Messages`}
            {...(!isLoading && { onPress: handlePress })}
            right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={isLoading} />}
            testID={HouseholdInviteRowSelector.Card}
        />
    );
};
