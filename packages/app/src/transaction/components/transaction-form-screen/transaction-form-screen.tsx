import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly onGoBack: () => void;
    readonly right?: ReactNode;
    readonly children: ReactNode;
}

export const TransactionFormScreen = ({ title, onGoBack, right, children }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const contentStyle = { paddingBottom: Math.max(bottom, 8) };

    return (
        <GroupedSurface>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <ScreenChromeHeader inFlow>
                        <GoBackButton className="min-h-[44px] min-w-[44px] items-center justify-center" onPress={onGoBack} />
                        <Text
                            className="min-w-0 flex-1 px-md text-center text-[17px] font-semibold text-primary"
                            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                            numberOfLines={2}
                            accessibilityRole="header"
                        >
                            {title}
                        </Text>
                        <View className="min-w-[44px] items-center justify-center">{right}</View>
                    </ScreenChromeHeader>
                    <View className="px-5xl flex-1" style={contentStyle}>
                        {children}
                    </View>
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
