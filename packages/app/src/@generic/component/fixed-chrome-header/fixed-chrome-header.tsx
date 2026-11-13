import { Text, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly leading?: ReactNode;
}

export const FixedChromeHeader = ({ title, leading }: Props) => {
    const style = useResolveClassNames('bg-surface');

    return (
        <ScreenChromeHeader style={style}>
            <View className="absolute inset-0 items-center justify-center px-[60px]" pointerEvents="none">
                <Text
                    className="text-primary text-[17px] font-semibold"
                    accessibilityRole="header"
                    numberOfLines={1}
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                >
                    {title}
                </Text>
            </View>
            {leading}
        </ScreenChromeHeader>
    );
};
