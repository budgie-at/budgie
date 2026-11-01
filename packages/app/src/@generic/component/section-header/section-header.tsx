import { Text, View } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly trailing?: ReactNode;
}

export const SectionHeader = ({ label, trailing }: Props) => (
    <View className="min-h-[28px] flex-row items-center justify-between gap-x-md pt-xl">
        <Text accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-md font-semibold text-primary">
            {label}
        </Text>
        {trailing}
    </View>
);
