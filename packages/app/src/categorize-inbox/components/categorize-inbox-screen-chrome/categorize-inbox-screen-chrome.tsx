import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { BottomChromeInsetProvider, ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';
import { isNotEmptyString } from '@rnw-community/shared';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { testID } from '../../../@generic/utils/test-id.util';
import { AccountDetailsHeaderBackdrop } from '../../../account/component/account-details-header-backdrop/account-details-header-backdrop';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly title?: string;
    readonly titleTestID?: string;
}

export const CategorizeInboxScreenChrome = ({ children, title, titleTestID }: Props) => {
    const router = useRouter();

    const handleGoBack = () => void router.back();

    const titleNode = isNotEmptyString(title) ? (
        <View className="absolute inset-0 items-center justify-center px-[72px]" pointerEvents="none">
            <Text
                className="text-primary text-2xl leading-[26px] font-semibold text-center"
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.77}
                accessibilityRole="header"
                {...testID(titleTestID)}
            >
                {title}
            </Text>
        </View>
    ) : null;

    return (
        <ScreenChromeThemeProvider>
            <BottomChromeInsetProvider>
                <ScreenChromeFrame>
                    {children}

                    <AccountDetailsHeaderBackdrop />

                    <ScreenChromeHeader>
                        {titleNode}
                        <GoBackButton onPress={handleGoBack} />
                    </ScreenChromeHeader>
                </ScreenChromeFrame>
            </BottomChromeInsetProvider>
        </ScreenChromeThemeProvider>
    );
};
