import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { RefObject } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { AccountSelectorBottomSheet } from '../component/account-selector-bottom-sheet/account-selector-bottom-sheet';
import { useAccountBalanceQuery } from '../query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../query/use-get-account-by-id.query';

interface UseAccountSelectorParams {
    readonly accountId: number | null;
    readonly emptyStateDescription?: string;
    readonly excludeAccountId?: number | null;
    readonly excludeAccountTypes?: AccountTypeEnum[];
    readonly onSelect: (accountId: number) => Promise<void> | void;
}

export const useAccountSelector = (args: UseAccountSelectorParams) => {
    const { accountId, excludeAccountId = null, excludeAccountTypes, emptyStateDescription, onSelect } = args;
    const { decimalPlaces, defaultInstrument } = useSettingsContext();

    const { account: selectedAccount } = useGetAccountByIdQuery(accountId ?? 0);
    const { balance } = useAccountBalanceQuery(accountId ?? 0);
    const formatDigits = useFormatDigits(decimalPlaces);

    const formattedBalance = formatDigits(balance, selectedAccount?.instrument.symbol ?? defaultInstrument.symbol);
    const hasAccount = isDefined(selectedAccount);
    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;

    const renderBottomSheet = (ref: RefObject<BottomSheetInterface | null>) => (
        <AccountSelectorBottomSheet
            emptyStateDescription={emptyStateDescription}
            selectedAccount={selectedAccount}
            excludeAccountId={excludeAccountId}
            excludeAccountTypes={excludeAccountTypes}
            onSelect={onSelect}
            ref={ref}
        />
    );

    return {
        icon,
        hasAccount,
        selectedAccount,
        formattedBalance,
        renderBottomSheet
    };
};
