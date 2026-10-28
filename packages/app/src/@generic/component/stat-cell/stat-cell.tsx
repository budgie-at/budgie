import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { STAT_CELL_APPEARANCE_CLASS_NAME } from '../../constant/stat-cell-appearance-class-name.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { StatCellAppearance } from '../../type/stat-cell-appearance.type';
import { cn } from '../../utils/cn.util';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly variant: ColorPaletteVariant;
    readonly appearance?: StatCellAppearance;
    readonly testID?: string;
}

export const StatCell = ({ label, value, variant, appearance = 'centered', testID }: Props) => {
    const { container, value: valueClassName } = STAT_CELL_APPEARANCE_CLASS_NAME[appearance];

    return (
        <View className={cn(container)}>
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.8}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className="shrink text-xxs uppercase tracking-wider text-secondary-foreground"
            >
                {label}
            </Text>
            <ProtectedText
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                testID={testID}
                className={cn(valueClassName, FOREGROUND_COLOR_PALETTE[variant])}
            >
                {value}
            </ProtectedText>
        </View>
    );
};
