import { View } from 'react-native';

import { AccountCard } from '../account-card/account-card';

import { AccountEntityInterface, CurrencyEnum } from '@budgie/contracts';

interface Props {
    readonly accounts: AccountEntityInterface[];
}

export const AccountList = ({ accounts }: Props) => (
    <View className="flex-row flex-wrap -mx-1.5 gap-y-3">
        {accounts.map(account => (
            <View className="w-1/2 px-1.5" key={account.id}>
                <AccountCard balance={0} currency={CurrencyEnum.USD} icon="Home" title={account.title} />
            </View>
        ))}
    </View>
);
