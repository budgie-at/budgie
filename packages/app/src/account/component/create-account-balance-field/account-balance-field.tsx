import { AccountCreateEntityInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AccountBalanceInput } from '../account-balance-input/account-balance-input';

interface Props {
    control: Control<AccountCreateEntityInterface>;
    instrumentSymbol: string;
}

export const AccountBalanceField = ({ control, instrumentSymbol }: Props) => {
    const renderInput = ({ field: { value, onChange } }: UseControllerReturn<AccountCreateEntityInterface, 'currentBalance'>) => (
        <View className="flex-row items-center justify-center pt-[40px] pb-7xl">
            <Text className="text-[72px] text-default-foreground">{instrumentSymbol} </Text>

            <AccountBalanceInput value={value} onChange={onChange} />
        </View>
    );

    return <Controller control={control} name="currentBalance" render={renderInput} />;
};
