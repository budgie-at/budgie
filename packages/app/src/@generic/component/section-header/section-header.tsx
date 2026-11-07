import { Text, View } from 'react-native';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/title-max-font-size-multiplier.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly trailing?: ReactNode;
}

export const SectionHeader = ({ label, trailing }: Props) => (
    <View className="min-h-[28px] flex-row items-center justify-between gap-x-md pt-xl">
        <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
            className="text-md font-semibold text-primary"
        >
            {label}
        </Text>
        {trailing}
    </View>
);
