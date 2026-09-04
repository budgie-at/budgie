import { cn } from 'cn';
import { Text, View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { TestIDPartEnum } from '../../enum/test-id-part.enum';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { testID as testIDProps } from '../../utils/test-id.util';
import { ChromeKeyboardScrollView } from '../chrome-keyboard-scroll-view/chrome-keyboard-scroll-view';
import { CollapsibleChromeHeader } from '../collapsible-chrome-header/collapsible-chrome-header';
import { CollapsibleHeaderBackdrop } from '../collapsible-header-backdrop/collapsible-header-backdrop';
import { CollapsibleHeaderLargeTitle } from '../collapsible-header-large-title/collapsible-header-large-title';
import { StickyFooterBand } from '../sticky-footer-band/sticky-footer-band';

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
};

const FOOTER_CONTENT_BOTTOM_INSET = 96;

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
    testID
}: Props): ReactNode => {
    const contentInsetBottom = isDefined(footer) ? FOOTER_CONTENT_BOTTOM_INSET : 0;
    const { bottomOffset: bottomOffsetOverride, ...restScrollViewProps } = isDefined(scrollViewProps) ? scrollViewProps : {};
    const resolvedBottomOffset = isDefined(bottomOffsetOverride) ? bottomOffsetOverride : contentInsetBottom;
    const resolvedLargeTitle = isDefined(largeTitle) ? (
        largeTitle
    ) : (
        <View className="gap-y-xs">
            <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
                {title}
            </Text>
            {isDefined(subtitle) ? (
                <Text className="text-secondary-foreground text-xs" numberOfLines={1}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
    const resolvedSmallTitle = isDefined(smallTitle) ? (
        smallTitle
    ) : (
        <View className="items-center">
            <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
                {title}
            </Text>
            {isDefined(subtitle) ? (
                <Text className="text-secondary-foreground text-xs text-center" numberOfLines={1}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );

    const largeTitleLayer = (
        <CollapsibleHeaderLargeTitle hasLeadingSlot={isDefined(leading)} hasTrailingSlot={isDefined(trailing)}>
            {resolvedLargeTitle}
        </CollapsibleHeaderLargeTitle>
    );

    return (
        <ScreenChromeThemeProvider>
            <ScreenChromeFrame>
                <ChromeKeyboardScrollView
                    {...restScrollViewProps}
                    contentInsetTop={SCREEN_CHROME_CONTENT_INSET_TOP}
                    contentInsetBottom={contentInsetBottom}
                    bottomOffset={resolvedBottomOffset}
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
                    expandedTitle={largeTitleLayer}
                    collapsedTitle={resolvedSmallTitle}
                />

                {isDefined(footer) ? <StickyFooterBand>{footer}</StickyFooterBand> : null}
            </ScreenChromeFrame>
        </ScreenChromeThemeProvider>
    );
};
