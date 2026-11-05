import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useHousehold } from '../../hook/use-household.hook';

import { FamilyRowSelector } from './family-row.selector';

const handlePress = () => void router.push('/settings/family');

export const FamilyRow = () => {
    const { t } = useLingui();
    const { isOwner, isMember } = useHousehold();

    const ownerSubtitle = t`You share a household`;
    const memberSubtitle = t`You joined a shared household`;
    const emptySubtitle = t`Share accounts with your family`;
    const subtitle = isOwner ? ownerSubtitle : isMember ? memberSubtitle : emptySubtitle;

    return (
        <SettingsRow
            icon={UserIconNameEnum.Users}
            variant="ghost"
            title={t`Family`}
            subtitle={subtitle}
            onPress={handlePress}
            testID={FamilyRowSelector.Card}
        />
    );
};
