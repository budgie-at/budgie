import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { defaultAccountAtom } from '../../constants/settings-atoms.constant';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

export const DefaultAccountSelector = () => {
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const { t } = useLingui();
    const [openAccountSelector] = useAccountSelectorModal();

    const selectedAccount = isDefined(defaultAccount?.deletedAt) ? null : defaultAccount;
    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;
    const accountLabel = selectedAccount?.title ?? t`None`;
    const defaultAccountSelectorId = SettingsPageSelector.DefaultAccountCard(selectedAccount);

    const handleOpen = () => {
        openAccountSelector({ initialAccountId: defaultAccount?.id ?? null }, accountId => {
            if (isDefined(accountId)) {
                appRuntime.runFork(
                    logAndContinue(
                        updateSettingsMutation({ defaultAccountId: accountId }).pipe(toastOnFailure(t`Could not update settings`))
                    )
                );
            }
        });
    };

    return (
        <SettingsRow
            icon={icon}
            variant="ghost"
            onPress={handleOpen}
            title={t`Default account`}
            right={<SettingsRowAccessory value={accountLabel} />}
            testID={defaultAccountSelectorId}
        />
    );
};
