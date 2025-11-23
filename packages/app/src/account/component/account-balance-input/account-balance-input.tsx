import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { AmountInput } from '../../../@generic/components/amount-input/amount-input';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useFormatDigits } from '../../../@generic/hooks/use-format-digits.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly value: number;
    readonly textClassName?: string;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (value: number) => void;
}

const textVariants = cva('text-[72px]', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const AccountBalanceInput = ({ value, onChange, variant, textClassName, instrumentSymbol }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const format = useFormatDigits(decimalPlaces);

    return (
        <View className="flex-row items-center justify-center pt-[40px] pb-7xl">
            <Text className={textVariants({ variant })}>{instrumentSymbol} </Text>

            <AmountInput
                value={value}
                onChangeValue={onChange}
                inputClassName={cn('text-[72px] text-primary placeholder-secondary-reverse-foreground', textClassName)}
                placeholder={format('0.00')}
            />
        </View>
    );
};
