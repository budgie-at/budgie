import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { Input } from '../input/input';

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
        <View className="flex-row items-center justify-center py-5xl px-lg h-32.5">
            <Input
                value={displayValue}
                onChangeText={handleChangeText}
                keyboardType="number-pad"
                className="text-7xl h-auto text-primary border-0 min-w-16"
                placeholder="0"
            />
            <Text className={cn('text-7xl', textVariants({ variant }))}>%</Text>
        </View>
    );
};
