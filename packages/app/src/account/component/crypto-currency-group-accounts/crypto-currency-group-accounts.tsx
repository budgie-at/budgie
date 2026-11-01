import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { AccountListItem } from '../account-list-item/account-list-item';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const CryptoCurrencyGroupAccounts = ({ group, balancesByAccountId }: Props) => (
    <View>
        {group.accounts.map(account => (
            <View key={account.id}>
                <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
                <AccountListItem account={account} type={AccountTypeEnum.CRYPTO} balancesByAccountId={balancesByAccountId} />
            </View>
        ))}
    </View>
);
