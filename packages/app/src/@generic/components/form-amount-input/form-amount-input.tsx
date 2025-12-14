import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { AmountInput } from '../amount-input/amount-input';

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

export const FormAmountInput = ({ value, onChange, variant, textClassName, instrumentSymbol }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const format = useFormatDigits(decimalPlaces);

    return (
        <View className="flex-row items-center justify-center pt-[40px] pb-7xl">
            <Text className={textVariants({ variant })}>{instrumentSymbol} </Text>

            <AmountInput
                value={value}
                onChangeValue={onChange}
                inputClassName={cn('text-[72px] text-primary placeholder-secondary-reverse-foreground border-0 h-auto', textClassName)}
                placeholder={format('0.00')}
            />
        </View>
    );
};
