import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly variant: ColorPaletteVariant;
}

export const RunwayFlowStat = ({ label, value, variant }: Props) => (
    <View accessible className="flex-1 gap-y-xs px-3xl py-xl">
        <Text numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
            {label}
        </Text>

        <ProtectedText
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            className={cn('text-xl font-semibold tabular-nums', FOREGROUND_COLOR_PALETTE[variant])}
        >
            {value}
        </ProtectedText>
    </View>
);
