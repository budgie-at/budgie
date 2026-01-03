import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { Input } from '../input/input';

const FONT_SIZE = 72;
const fontSizeStyle = { fontSize: FONT_SIZE };

interface Props {
    readonly value: number;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (value: number) => void;
}

const textVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const FormPercentageInput = ({ value, onChange, variant }: Props) => {
    const displayValue = value === 0 ? '' : String(value);

    const handleChangeText = (text: string) => {
        const cleaned = text.replace(/[^0-9]/gu, '');
        const numValue = cleaned === '' ? 0 : parseInt(cleaned, 10);
        const clampedValue = Math.min(100, Math.max(0, numValue));

        onChange(clampedValue);
    };

    return (
        <View className="flex-row items-center justify-center pl-4 pr-4 py-5xl px-lg h-36.5">
            <Input
                value={displayValue}
                onChangeText={handleChangeText}
                keyboardType="number-pad"
                className="h-auto text-primary border-0 min-w-16"
                placeholder="0"
                style={fontSizeStyle}
            />
            <Text className={textVariants({ variant })} style={fontSizeStyle}>
                {' '}%
            </Text>
        </View>
    );
};
