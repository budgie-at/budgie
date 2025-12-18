import { UserIconNameEnum } from '@budgie/contracts';
import { RefObject } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';
import { useFormatMoney } from '../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { AccountSelectorBottomSheet } from '../component/account-selector-bottom-sheet/account-selector-bottom-sheet';
import { useAccountBalanceQuery } from '../query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../query/use-get-account-by-id.query';

interface UseAccountSelectorParams {
    readonly accountId: number | null;
    readonly emptyStateDescription?: string;
    readonly excludeAccountId?: number | null;
    readonly onSelect: (accountId: number) => void;
}

export const useAccountSelector = ({ accountId, excludeAccountId = null, emptyStateDescription, onSelect }: UseAccountSelectorParams) => {
    const { defaultCurrency, decimalPlaces } = useSettingsContext();

    const { account: selectedAccount } = useGetAccountByIdQuery(accountId ?? 0);
    const { balance } = useAccountBalanceQuery(accountId ?? 0);
    const formatMoney = useFormatMoney(decimalPlaces, selectedAccount?.instrument.code ?? defaultCurrency);

    const formattedBalance = formatMoney(balance);
    const hasAccount = isDefined(selectedAccount);
    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;

    const renderBottomSheet = (ref: RefObject<BottomSheetInterface | null>) => (
        <AccountSelectorBottomSheet
            emptyStateDescription={emptyStateDescription}
            selectedAccount={selectedAccount}
            excludeAccountId={excludeAccountId}
            onSelect={onSelect}
            ref={ref}
        />
    );

    return {
        icon,
        balance,
        hasAccount,
        selectedAccount,
        formattedBalance,
        renderBottomSheet
    };
};
