import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useHouseholdOrganizerName } from '../../hook/use-household-organizer-name.hook';

import { HouseholdOrganizerRowSelector } from './household-organizer-row.selector';

export const HouseholdOrganizerRow = () => {
    const { t } = useLingui();
    const organizerName = useHouseholdOrganizerName();

    return (
        <SettingsRow
            icon={UserIconNameEnum.Crown}
            variant="ghost"
            title={organizerName ?? t`Family organizer`}
            subtitle={t`Organizer`}
            testID={HouseholdOrganizerRowSelector.Card}
        />
    );
};
