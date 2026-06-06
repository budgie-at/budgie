import { View } from 'react-native';

import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { pairAccountsIntoRows } from '../../utils/pair-accounts-into-rows.util';
import { CryptoCurrencyGroupAccountRow } from '../crypto-currency-group-account-row/crypto-currency-group-account-row';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const CryptoCurrencyGroupAccounts = ({ group, balancesByAccountId }: Props) => {
    const rows = pairAccountsIntoRows(group.accounts);

    return (
        <View className="gap-y-3">
            {rows.map(row => (
                <CryptoCurrencyGroupAccountRow key={row.left.id} row={row} balancesByAccountId={balancesByAccountId} />
            ))}
        </View>
    );
};
