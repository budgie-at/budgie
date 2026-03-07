import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { SettingsPageSelectors } from '../../../@e2e/selectors/settings-page.selector';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useAccountSelector } from '../../../account/hooks/use-account-selector.hook';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const DefaultAccountSelector = () => {
    const { defaultAccount } = useSettingsContext();
    const { t } = useLingui();
    const [openAccountSelector] = useAccountSelectorModal();

    const { selectedAccount, icon } = useAccountSelector({ accountId: defaultAccount?.id ?? null });

    const description = isDefined(selectedAccount) ? `${selectedAccount.title} – ${selectedAccount.instrument.code}` : null;

    const handleOpen = async () => {
        const accountId = await openAccountSelector({ initialAccountId: defaultAccount?.id ?? null });

        if (isDefined(accountId)) {
            await updateSettingsMutation({ defaultAccountId: accountId });
        }
    };

    return (
        <SettingsCard
            icon={icon}
            variant="ghost"
            onPress={handleOpen}
            title={t`Default Account`}
            description={description ?? t`None selected`}
            testID={SettingsPageSelectors.DefaultAccountCard}
            {...(isDefined(selectedAccount) && {
                descriptionTestID: SettingsPageSelectors.DefaultAccountValue(selectedAccount.title)
            })}
        />
    );
};
