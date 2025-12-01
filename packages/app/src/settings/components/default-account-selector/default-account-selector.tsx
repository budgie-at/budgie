import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { AccountSelectorBottomSheet } from '../../../account/component/account-selector-bottom-sheet/account-selector-bottom-sheet';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { GenericSelectorCard } from '../generic-selector-card/generic-selector-card';

export const DefaultAccountSelector = () => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { defaultAccount } = useSettingsContext();
    const { t } = useLingui();

    const updateDefaultAccount = async (defaultAccountId: number) => {
        await updateSettingsMutation({ defaultAccountId });
    };

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <GenericSelectorCard
                title={t`Default Account`}
                description={defaultAccount?.title ?? t`None selected`}
                icon="Wallet"
                iconVariant="ghost"
                onPress={handleOpen}
            />

            <AccountSelectorBottomSheet
                excludeAccountId={null}
                selectedAccount={defaultAccount}
                onSelect={updateDefaultAccount}
                ref={ref}
            />
        </>
    );
};
