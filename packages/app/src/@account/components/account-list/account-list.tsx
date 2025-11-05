import { View } from 'react-native';

import { AccountCard } from '../account-card/account-card';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly accounts: AccountEntityInterface[];
}

export const AccountList = ({ accounts }: Props) => (
    <View className="flex-row flex-wrap -mx-1.5 gap-y-3">
        {accounts.map(account => (
            <View className="w-1/2 px-1.5" key={account.id}>
                { }
                <AccountCard balance={account.balance} currency={account.currency} icon="Home" title={account.title} />
            </View>
        ))}
    </View>
);


