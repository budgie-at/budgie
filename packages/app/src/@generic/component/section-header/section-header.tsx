import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly trailing?: ReactNode;
}

export const SectionHeader = ({ label, trailing }: Props) => {
    if (!isDefined(trailing)) {
        return (
            <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className="mt-8xl pt-xl pb-xl text-md font-semibold text-primary"
            >
                {label}
            </Text>
        );
    }

    return (
        <View className="mt-8xl flex-row items-center justify-between">
            <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className="pt-xl pb-xl text-md font-semibold text-primary"
            >
                {label}
            </Text>
            {trailing}
        </View>
    );
};
