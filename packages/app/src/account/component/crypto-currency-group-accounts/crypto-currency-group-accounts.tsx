import { View } from 'react-native';

import { AccountRowInterface } from '../../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { CryptoCurrencyGroupAccountRow } from '../crypto-currency-group-account-row/crypto-currency-group-account-row';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
}

const pairAccountsIntoRows = (group: CryptoCurrencyGroupInterface): AccountRowInterface[] => {
    const rows: AccountRowInterface[] = [];

    for (let index = 0; index < group.accounts.length; index += 2) {
        rows.push({
            left: group.accounts[index],
            right: group.accounts[index + 1]
        });
    }

    return rows;
};

export const CryptoCurrencyGroupAccounts = ({ group }: Props) => {
    const rows = pairAccountsIntoRows(group);

    return (
        <View className="gap-y-3">
            {rows.map(row => (
                <CryptoCurrencyGroupAccountRow key={row.left.id} row={row} />
            ))}
        </View>
    );
};
