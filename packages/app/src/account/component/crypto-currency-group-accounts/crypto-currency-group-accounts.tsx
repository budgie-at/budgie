import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { pairAccountsIntoRows } from '../../utils/pair-accounts-into-rows.util';
import { AccountGridRow } from '../account-grid-row/account-grid-row';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const CryptoCurrencyGroupAccounts = ({ group, balancesByAccountId }: Props) => {
    const rows = pairAccountsIntoRows(group.accounts);

    return (
        <View className="gap-y-3">
            {rows.map(row => (
                <AccountGridRow
                    key={row.left.id}
                    row={row}
                    accountType={AccountTypeEnum.CRYPTO}
                    balancesByAccountId={balancesByAccountId}
                />
            ))}
        </View>
    );
};
