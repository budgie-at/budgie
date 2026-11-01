import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isPositiveNumber } from '@rnw-community/shared';

import { useArchivedAccountsQuery } from '../../../account/query/use-archived-accounts.query';
import { useInactiveAccountsQuery } from '../../../account/query/use-inactive-accounts.query';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

const handleNavigateToArchived = () => void router.push('/settings/archived');
const handleNavigateToInactive = () => void router.push('/settings/inactive');

export const AccountsSettingsRows = () => {
    const { t } = useLingui();
    const archivedAccounts = useArchivedAccountsQuery();
    const inactiveAccounts = useInactiveAccountsQuery();

    const archivedCount = isPositiveNumber(archivedAccounts.length) ? String(archivedAccounts.length) : '';
    const inactiveCount = isPositiveNumber(inactiveAccounts.length) ? String(inactiveAccounts.length) : '';

    return (
        <>
            <SettingsRow
                onPress={handleNavigateToArchived}
                title={t`Archived accounts`}
                icon={UserIconNameEnum.Archive}
                variant="ghost"
                right={<SettingsRowAccessory value={archivedCount} />}
                testID={SettingsPageSelector.ArchivedCard}
            />
            <SettingsRow
                onPress={handleNavigateToInactive}
                title={t`Hidden accounts`}
                icon={UserIconNameEnum.EyeOff}
                variant="ghost"
                right={<SettingsRowAccessory value={inactiveCount} />}
                testID={SettingsPageSelector.InactiveCard}
            />
        </>
    );
};
