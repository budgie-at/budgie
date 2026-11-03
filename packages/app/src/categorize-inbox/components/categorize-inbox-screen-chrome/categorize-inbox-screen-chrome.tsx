import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { BottomChromeInsetProvider, ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { CategorizeInboxHeaderBackdrop } from '../categorize-inbox-header-backdrop/categorize-inbox-header-backdrop';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly title: ReactNode;
}

export const CategorizeInboxScreenChrome = ({ children, title }: Props) => {
    const router = useRouter();

    const handleGoBack = () => void router.back();

    return (
        <ScreenChromeThemeProvider>
            <BottomChromeInsetProvider>
                <ScreenChromeFrame>
                    {children}

                    <CategorizeInboxHeaderBackdrop />

                    <ScreenChromeHeader>
                        <View className="absolute inset-0 items-center justify-center px-[72px]" pointerEvents="none">
                            {title}
                        </View>
                        <GoBackButton onPress={handleGoBack} />
                    </ScreenChromeHeader>
                </ScreenChromeFrame>
            </BottomChromeInsetProvider>
        </ScreenChromeThemeProvider>
    );
};
