import { useState } from 'react';
import { View } from 'react-native';

import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { CryptoCurrencyGroupAccounts } from '../crypto-currency-group-accounts/crypto-currency-group-accounts';
import { CryptoCurrencyGroupMarketLink } from '../crypto-currency-group-market-link/crypto-currency-group-market-link';
import { CryptoCurrencyGroupToggleRow } from '../crypto-currency-group-toggle-row/crypto-currency-group-toggle-row';

import { CryptoCurrencyGroupCardSelector } from './crypto-currency-group-card.selector';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
    readonly balance: number;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const CryptoCurrencyGroupCard = ({ group, balance, balancesByAccountId }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleOpen = () => void setIsOpen(value => !value);

    return (
        <View testID={CryptoCurrencyGroupCardSelector.Card(group.instrument.code)}>
            <CryptoCurrencyGroupMarketLink instrument={group.instrument} balance={balance} />

            <CryptoCurrencyGroupToggleRow
                accountsCount={group.accounts.length}
                instrumentCode={group.instrument.code}
                isOpen={isOpen}
                onPress={toggleOpen}
                testID={CryptoCurrencyGroupCardSelector.Toggle(group.instrument.code)}
            />

            {isOpen ? <CryptoCurrencyGroupAccounts group={group} balancesByAccountId={balancesByAccountId} /> : null}
        </View>
    );
};
