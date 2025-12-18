import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useAccountSelector } from '../../../account/hooks/use-account-selector.hook';
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

    const { selectedAccount, icon, renderBottomSheet } = useAccountSelector({
        accountId: defaultAccount?.id ?? null,
        onSelect: updateDefaultAccount,
        excludeAccountId: null
    });

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <GenericSelectorCard
                icon={icon}
                iconVariant="ghost"
                onPress={handleOpen}
                title={t`Default Account`}
                description={selectedAccount?.title ?? t`None selected`}
            />

            {renderBottomSheet(ref)}
        </>
    );
};
