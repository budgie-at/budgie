import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { AccountSelectorBottomSheet } from '../../../account/component/account-selector-bottom-sheet/account-selector-bottom-sheet';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const DefaultAccountSelector = () => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const { defaultAccount } = useSettingsContext();
    const { t } = useLingui();

    const { account: selectedAccount } = useGetAccountByIdQuery(defaultAccount?.id ?? 0);

    const updateDefaultAccount = async (defaultAccountId: number) => {
        await updateSettingsMutation({ defaultAccountId });
    };

    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;
    const description = isDefined(selectedAccount) ? `${selectedAccount.title} – ${selectedAccount.instrument.code}` : null;

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <SettingsCard
                icon={icon}
                variant="ghost"
                onPress={handleOpen}
                title={t`Default Account`}
                description={description ?? t`None selected`}
            />

            <AccountSelectorBottomSheet
                selectedAccount={selectedAccount ?? null}
                excludeAccountId={null}
                onSelect={updateDefaultAccount}
                ref={ref}
            />
        </>
    );
};
