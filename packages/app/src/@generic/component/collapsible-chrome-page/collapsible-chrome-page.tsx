import { Text, View } from 'react-native';

import { BottomChromeInsetProvider, CollapsibleHeaderBackdrop, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { CHROME_TITLE_TEXT_PROPS } from '../../constant/chrome-title-text-props.constant';
import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { TestIDPartEnum } from '../../enum/test-id-part.enum';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { cn } from '../../utils/cn.util';
import { testID as testIDProps } from '../../utils/test-id.util';
import { ChromeKeyboardScrollView } from '../chrome-keyboard-scroll-view/chrome-keyboard-scroll-view';
import { CollapsibleChromeHeader } from '../collapsible-chrome-header/collapsible-chrome-header';
import { StickyFooterBand } from '../sticky-footer-band/sticky-footer-band';

import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';
import type { ComponentProps, ReactNode } from 'react';

type TitleProps =
    | { readonly title: string; readonly subtitle?: string; readonly largeTitle?: never; readonly smallTitle?: never }
    | { readonly title?: never; readonly subtitle?: never; readonly largeTitle: ReactNode; readonly smallTitle: ReactNode };

type Props = TitleProps & {
    readonly children: ReactNode;
    readonly leading?: ReactNode;
    readonly trailing?: ReactNode;
    readonly footer?: ReactNode;
    readonly scrollViewProps?: Pick<ComponentProps<typeof ChromeKeyboardScrollView>, 'ref' | 'onLayout' | 'bottomOffset'>;
    readonly contentClassName?: string;
    readonly testID?: string;
    readonly chromeConfig?: ScreenChromeConfigOverridesInterface;
};

export const CollapsibleChromePage = ({
    title,
    subtitle,
    largeTitle,
    smallTitle,
    children,
    leading,
    trailing,
    footer,
    scrollViewProps,
    contentClassName,
    testID,
    chromeConfig
}: Props): ReactNode => {
    const resolvedLargeTitle = isDefined(largeTitle) ? (
        largeTitle
    ) : (
        <View className="gap-y-xs">
            <Text className="text-primary font-medium text-3xl" {...CHROME_TITLE_TEXT_PROPS}>
                {title}
            </Text>
            {isDefined(subtitle) ? (
                <Text className="text-secondary-foreground text-xs" {...CHROME_TITLE_TEXT_PROPS}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
    const resolvedSmallTitle = isDefined(smallTitle) ? (
        smallTitle
    ) : (
        <View className="items-center">
            <Text className="text-primary text-lg font-semibold text-center" {...CHROME_TITLE_TEXT_PROPS}>
                {title}
            </Text>
            {isDefined(subtitle) ? (
                <Text className="text-secondary-foreground text-xs text-center" {...CHROME_TITLE_TEXT_PROPS}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );

    return (
        <ScreenChromeThemeProvider syncNativeScrollOffset {...(isDefined(chromeConfig) && { config: chromeConfig })}>
            <BottomChromeInsetProvider>
                <ScreenChromeFrame>
                    <ChromeKeyboardScrollView
                        {...scrollViewProps}
                        contentInsetTop={SCREEN_CHROME_CONTENT_INSET_TOP}
                        showsVerticalScrollIndicator={false}
                        testID={testID}
                    >
                        <View className={cn('px-5xl', contentClassName)}>{children}</View>
                    </ChromeKeyboardScrollView>

                    <CollapsibleHeaderBackdrop />

                    <CollapsibleChromeHeader
                        {...testIDProps(testID, TestIDPartEnum.HEADER)}
                        leading={leading}
                        trailing={trailing}
                        expandedTitle={resolvedLargeTitle}
                        collapsedTitle={resolvedSmallTitle}
                    />

                    {isDefined(footer) ? <StickyFooterBand>{footer}</StickyFooterBand> : null}
                </ScreenChromeFrame>
            </BottomChromeInsetProvider>
        </ScreenChromeThemeProvider>
    );
};
