import {
    CollapsibleHeader,
    CollapsibleHeaderBackdrop,
    CollapsibleHeaderLargeTitle,
    CollapsibleHeaderLargeTitleLine,
    CollapsibleHeaderLeading,
    CollapsibleHeaderSmallTitle,
    CollapsibleHeaderTitleSlot,
    CollapsibleHeaderTrailing,
    ScreenChromeFrame,
    ScreenChromeScrollView
} from '@budgie/screen-chrome';
import { ComponentProps, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly title: string;
    readonly children: ReactNode;
    readonly leading?: ReactNode;
    readonly trailing?: ReactNode;
    readonly scrollViewProps?: Pick<ComponentProps<typeof ScreenChromeScrollView>, 'ref' | 'onLayout'>;
    readonly contentClassName?: string;
    readonly testID?: string;
}

const CONTENT_TOP_INSET = 76;
const NAV_ROW_HEIGHT = 56;
const LARGE_TITLE_LINE_HEIGHT = 44;
const LEADING_HEADER_HEIGHT = NAV_ROW_HEIGHT + LARGE_TITLE_LINE_HEIGHT;
const LEADING_CONTENT_TOP_INSET = LEADING_HEADER_HEIGHT + 12;

export const CollapsibleChromePage = ({
    title,
    children,
    leading,
    trailing,
    scrollViewProps,
    contentClassName,
    testID
}: Props): ReactNode => {
    const hasLeading = isDefined(leading);
    const themeProviderProps = hasLeading ? { config: { headerHeight: LEADING_HEADER_HEIGHT } } : {};
    const contentInsetTop = hasLeading ? LEADING_CONTENT_TOP_INSET : CONTENT_TOP_INSET;
    const trailingSlot = isDefined(trailing) ? <CollapsibleHeaderTrailing>{trailing}</CollapsibleHeaderTrailing> : null;
    const smallTitleText = (
        <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
            {title}
        </Text>
    );

    return (
        <ScreenChromeThemeProvider {...themeProviderProps}>
            <ScreenChromeFrame>
                <ScreenChromeScrollView
                    {...scrollViewProps}
                    contentInsetTop={contentInsetTop}
                    showsVerticalScrollIndicator={false}
                    testID={testID}
                >
                    <View className={cn('px-5xl', contentClassName)}>{children}</View>
                </ScreenChromeScrollView>

                <CollapsibleHeaderBackdrop />

                {hasLeading ? (
                    <CollapsibleHeader
                        bottom={
                            <CollapsibleHeaderLargeTitleLine>
                                <Text className="text-primary font-medium text-3xl px-5xl" numberOfLines={1}>
                                    {title}
                                </Text>
                            </CollapsibleHeaderLargeTitleLine>
                        }
                    >
                        <CollapsibleHeaderLeading>{leading}</CollapsibleHeaderLeading>
                        <CollapsibleHeaderTitleSlot>
                            <CollapsibleHeaderSmallTitle>{smallTitleText}</CollapsibleHeaderSmallTitle>
                        </CollapsibleHeaderTitleSlot>
                        {trailingSlot}
                    </CollapsibleHeader>
                ) : (
                    <CollapsibleHeader>
                        <CollapsibleHeaderTitleSlot>
                            <CollapsibleHeaderLargeTitle>
                                <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
                                    {title}
                                </Text>
                            </CollapsibleHeaderLargeTitle>
                            <CollapsibleHeaderSmallTitle>{smallTitleText}</CollapsibleHeaderSmallTitle>
                        </CollapsibleHeaderTitleSlot>
                        {trailingSlot}
                    </CollapsibleHeader>
                )}
            </ScreenChromeFrame>
        </ScreenChromeThemeProvider>
    );
};
