import { Text, View } from 'react-native';

import { AccountBalanceInput } from '../account-balance-input/account-balance-input';

interface Props {
    readonly value: number;
    readonly instrumentSymbol: string;
    readonly onChange: (value: number) => void;
}

export const CreateAccountBalanceInput = ({ value, onChange, instrumentSymbol }: Props) => (
    <View className="flex-row items-center justify-center pt-[40px] pb-7xl">
        <Text className="text-[72px] text-default-foreground">{instrumentSymbol} </Text>

        <AccountBalanceInput value={value} onChange={onChange} />
    </View>
);
