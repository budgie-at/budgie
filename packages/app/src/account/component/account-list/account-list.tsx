import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { AccountCard } from '../account-card/account-card';

interface Props {
    readonly accounts: AccountWithInstrumentEntityInterface[];
    readonly type: AccountTypeEnum;
}

export const AccountList = ({ accounts, type }: Props) => {
    const { i18n } = useLingui();

    return (
        <View className="gap-y-xl">
            <Text className="text-xs uppercase text-secondary-foreground">{i18n.t(ACCOUNT_TYPE[type])}</Text>

            <View className="flex-row flex-wrap -mx-1.5 gap-y-3 pb-[30px]">
                {accounts.map(({ id, title, icon, instrument }) => (
                    <View className="w-1/2 px-1.5" key={id}>
                        <AccountCard id={id} icon={icon} title={title} instrumentSymbol={instrument.symbol} />
                    </View>
                ))}
            </View>
        </View>
    );
};
