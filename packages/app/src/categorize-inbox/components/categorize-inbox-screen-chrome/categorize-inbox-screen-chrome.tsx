import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { BottomChromeInsetProvider, ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { cn } from '../../../@generic/utils/cn.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { AccountDetailsHeaderBackdrop } from '../../../account/component/account-details-header-backdrop/account-details-header-backdrop';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly title?: string;
    readonly titleTestID?: string;
    readonly trailing?: ReactNode;
}

export const CategorizeInboxScreenChrome = ({ children, title, titleTestID, trailing }: Props) => {
    const router = useRouter();

    const titleInsetClassName = isDefined(trailing) ? 'px-[112px]' : 'px-[72px]';

    const handleGoBack = () => void router.back();

    const titleNode = isNotEmptyString(title) ? (
        <View className={cn('absolute inset-0 items-center justify-center', titleInsetClassName)} pointerEvents="none">
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
                        {trailing}
                    </ScreenChromeHeader>
                </ScreenChromeFrame>
            </BottomChromeInsetProvider>
        </ScreenChromeThemeProvider>
    );
};
