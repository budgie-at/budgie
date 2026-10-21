import { AccountWithSyncEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
}

export const CryptoAccountCard = ({ account, balance }: Props) => {
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const formattedBalance = formatInstrumentAmount(balance, account.instrument.code, InstrumentTypeEnum.CRYPTO);

    return (
        <AccountCardBase account={account} balance={balance}>
            <ProtectedText
                testID={AccountCardBaseSelector.Balance(account.title, formattedBalance)}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                className="text-2xl font-semibold tracking-tight tabular-nums text-primary"
            >
                {formattedBalance}
            </ProtectedText>
        </AccountCardBase>
    );
};
