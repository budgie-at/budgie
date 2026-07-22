import {
    CollapsibleHeader,
    CollapsibleHeaderBackdrop,
    CollapsibleHeaderLargeTitle,
    CollapsibleHeaderLeading,
    CollapsibleHeaderSmallTitle,
    CollapsibleHeaderTitleSlot,
    CollapsibleHeaderTrailing,
    ScreenChromeFrame
} from '@budgie/screen-chrome';
import { ComponentProps, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { cn } from '../../utils/cn.util';
import { ChromeKeyboardScrollView } from '../chrome-keyboard-scroll-view/chrome-keyboard-scroll-view';
import { StickyFooterBand } from '../sticky-footer-band/sticky-footer-band';

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

                <CollapsibleHeader>
                    {isDefined(leading) ? <CollapsibleHeaderLeading>{leading}</CollapsibleHeaderLeading> : null}
                    <CollapsibleHeaderTitleSlot>
                        <CollapsibleHeaderLargeTitle>{resolvedLargeTitle}</CollapsibleHeaderLargeTitle>
                    </CollapsibleHeaderTitleSlot>
                    {isDefined(trailing) ? <CollapsibleHeaderTrailing>{trailing}</CollapsibleHeaderTrailing> : null}
                    <CollapsibleHeaderSmallTitle>{resolvedSmallTitle}</CollapsibleHeaderSmallTitle>
                </CollapsibleHeader>

                {isDefined(footer) ? <StickyFooterBand>{footer}</StickyFooterBand> : null}
            </ScreenChromeFrame>
        </ScreenChromeThemeProvider>
    );
};
