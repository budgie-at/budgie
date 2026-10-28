import { Text, View } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';

interface Props {
    readonly label: string;
}

export const SectionHeader = ({ label }: Props) => (
    <View className="mt-lg flex-row items-center gap-x-md">
        <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            className="shrink text-xxs uppercase tracking-wider text-secondary-foreground"
        >
            {label}
        </Text>
        <View className="h-hairline min-w-[16px] flex-1 bg-secondary-corner" />
    </View>
);
