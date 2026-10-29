import { useRouter } from 'expo-router';

import { BottomChromeInsetProvider, EdgeFade, ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CategorizeInboxScreenChrome = ({ children }: Props) => {
    const router = useRouter();

    const handleGoBack = () => void router.back();

    return (
        <ScreenChromeThemeProvider>
            <BottomChromeInsetProvider>
                <ScreenChromeFrame>
                    {children}

                    <EdgeFade position="top" />

                    <ScreenChromeHeader>
                        <GoBackButton onPress={handleGoBack} />
                    </ScreenChromeHeader>
                </ScreenChromeFrame>
            </BottomChromeInsetProvider>
        </ScreenChromeThemeProvider>
    );
};
