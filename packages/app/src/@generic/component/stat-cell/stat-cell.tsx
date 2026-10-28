import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly variant: ColorPaletteVariant;
    readonly testID?: string;
}

export const StatCell = ({ label, value, variant, testID }: Props) => (
    <View className="flex-1 items-center gap-y-xs px-sm">
        <Text numberOfLines={1} className="text-xxs uppercase tracking-wider text-secondary-foreground">
            {label}
        </Text>
        <ProtectedText
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
            testID={testID}
            className={cn('text-md font-semibold tabular-nums', FOREGROUND_COLOR_PALETTE[variant])}
        >
            {value}
        </ProtectedText>
    </View>
);
