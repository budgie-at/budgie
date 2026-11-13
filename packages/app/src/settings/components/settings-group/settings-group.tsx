import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';

interface Props {
    title: string;
    children: ReactNode;
}

export const SettingsGroup = ({ title, children }: Props) => (
    <View className="gap-y-lg">
        <Text
            className="text-xs uppercase text-secondary-foreground"
            accessibilityRole="header"
            maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
        >
            {title}
        </Text>

        {children}
    </View>
);
