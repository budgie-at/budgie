import { AccountCreateEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountBalanceInput } from '../account-balance-input/account-balance-input';

interface Props {
    readonly control: Control<AccountCreateEntityInterface>;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
}

const textVariants = cva('text-[72px]', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const AccountBalanceField = ({ control, instrumentSymbol, variant }: Props) => {
    const renderInput = ({ field: { value, onChange } }: UseControllerReturn<AccountCreateEntityInterface, 'currentBalance'>) => (
        <View className="flex-row items-center justify-center pt-[40px] pb-7xl">
            <Text className={textVariants({ variant })}>{instrumentSymbol} </Text>

            <AccountBalanceInput value={value} onChange={onChange} />
        </View>
    );

    return <Controller control={control} name="currentBalance" render={renderInput} />;
};
