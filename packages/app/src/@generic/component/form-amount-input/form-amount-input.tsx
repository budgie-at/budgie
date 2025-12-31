import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { useAutoScaleFont } from '../../hook/use-auto-scale-font.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { AmountInput } from '../amount-input/amount-input';

const BASE_FONT_SIZE = 72;

interface Props {
    readonly value: number;
    readonly textClassName?: string;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (value: number) => void;
}

const textVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const FormAmountInput = ({ value, onChange, variant, textClassName, instrumentSymbol }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const displayedText = value === 0 ? '' : formatDigits(value.toString());

    const fullText = `${instrumentSymbol} ${displayedText}`;
    const { fontSize, onContainerLayout } = useAutoScaleFont(BASE_FONT_SIZE, fullText);

    const fontSizeStyle = { fontSize };

    return (
        <View className="flex-row items-center justify-center py-5xl px-lg h-36.5" onLayout={onContainerLayout}>
            <Text className={textVariants({ variant })} style={fontSizeStyle}>
                {instrumentSymbol}{' '}
            </Text>

            <AmountInput
                value={value}
                onChangeValue={onChange}
                inputClassName={cn('text-primary placeholder-secondary-reverse-foreground border-0 h-auto', textClassName)}
                placeholder={formatDigits(0)}
                style={fontSizeStyle}
            />
        </View>
    );
};
