import { Text, View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { TransactionFormHeaderBackdrop } from '../transaction-form-header-backdrop/transaction-form-header-backdrop';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly onGoBack: () => void;
    readonly right?: ReactNode;
    readonly children: ReactNode;
}

const HEADER_FONT_SCALE = 1.35;

export const TransactionFormScreen = ({ title, onGoBack, right, children }: Props) => (
    <GroupedSurface>
        <ScreenChromeThemeProvider syncNativeScrollOffset>
            <ScreenChromeFrame>
                <View className="flex-1">{children}</View>
                <TransactionFormHeaderBackdrop />
                <ScreenChromeHeader>
                    <GoBackButton className="min-h-[44px] min-w-[44px] items-center justify-center" onPress={onGoBack} />
                    <Text
                        className="min-w-0 flex-1 px-md text-center text-[17px] font-semibold text-primary"
                        maxFontSizeMultiplier={HEADER_FONT_SCALE}
                        numberOfLines={2}
                        accessibilityRole="header"
                    >
                        {title}
                    </Text>
                    <View className="min-w-[44px] items-center justify-center">{right}</View>
                </ScreenChromeHeader>
            </ScreenChromeFrame>
        </ScreenChromeThemeProvider>
    </GroupedSurface>
);
