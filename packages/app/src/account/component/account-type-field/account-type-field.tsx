import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';
import { View } from 'react-native';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { AccountTypeCard } from '../account-type-card/account-type-card';

interface Props<T extends { type: AccountTypeEnum }> {
    readonly control: Control<T>;
}

const LIABILITY_ACCOUNT_TYPES = [
    AccountTypeEnum.BANK,
    AccountTypeEnum.CASH,
    AccountTypeEnum.SAVINGS,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.STOCKS
];

export const AccountTypeField = <T extends { type: AccountTypeEnum }>({ control }: Props<T>) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormItem label={t`Account Type`}>
            <View className="gap-y-xl">
                {LIABILITY_ACCOUNT_TYPES.map(type => (
                    <AccountTypeCard key={type} type={type} isSelected={value === type} onSelect={onChange} />
                ))}
            </View>
        </FormItem>
    );

    return <Controller render={render} control={control} name={'type' as Path<T>} />;
};
