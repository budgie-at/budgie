import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useHouseholdOrganizerName } from '../../../household/hook/use-household-organizer-name.hook';
import { useHousehold } from '../../../household/hook/use-household.hook';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

export const FamilySectionHeader = () => {
    const { t } = useLingui();
    const { isMember } = useHousehold();
    const organizerName = useHouseholdOrganizerName();

    const title = isMember && isNotEmptyString(organizerName) ? t`${organizerName}'s family` : t`Family`;

    return (
        <AccountSectionHeaderFrame
            title={title}
            total={null}
            leading={<View className="size-[8px] rounded-full bg-secondary-foreground" />}
        />
    );
};
