import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { useAccountBalanceQuery } from '../query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../query/use-get-account-by-id.query';

interface UseAccountSelectorParams {
    readonly accountId: number | null;
    readonly excludeAccountTypes?: AccountTypeEnum[];
}

export const useAccountSelector = (args: UseAccountSelectorParams) => {
    const { accountId, excludeAccountTypes } = args;
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const { account: selectedAccount } = useGetAccountByIdQuery(accountId ?? 0);
    const { balance } = useAccountBalanceQuery(accountId ?? 0);
    const formatDigits = useDisplayFormatDigits();

    const formattedBalance = formatDigits(balance, selectedAccount?.instrument.symbol ?? defaultInstrument.symbol);
    const hasAccount = isDefined(selectedAccount);
    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;

    return {
        icon,
        hasAccount,
        selectedAccount,
        formattedBalance,
        excludeAccountTypes
    };
};
