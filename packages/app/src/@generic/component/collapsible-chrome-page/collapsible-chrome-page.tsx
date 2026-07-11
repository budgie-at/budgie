import {
    CollapsibleHeader,
    CollapsibleHeaderBackdrop,
    CollapsibleHeaderLargeTitle,
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

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly title: string;
    readonly children: ReactNode;
    readonly leading?: ReactNode;
    readonly trailing?: ReactNode;
    readonly scrollRef?: ComponentProps<typeof ScreenChromeScrollView>['ref'];
    readonly onScrollViewLayout?: (event: LayoutChangeEvent) => void;
    readonly contentClassName?: string;
    readonly testID?: string;
}

const CONTENT_TOP_INSET = 76;

export const CollapsibleChromePage = ({
    title,
    children,
    leading,
    trailing,
    scrollRef,
    onScrollViewLayout,
    contentClassName,
    testID
}: Props): ReactNode => (
    <ScreenChromeThemeProvider>
        <ScreenChromeFrame>
            <ScreenChromeScrollView
                ref={scrollRef}
                onLayout={onScrollViewLayout}
                contentInsetTop={CONTENT_TOP_INSET}
                showsVerticalScrollIndicator={false}
                testID={testID}
            >
                <View className={cn('px-5xl', contentClassName)}>{children}</View>
            </ScreenChromeScrollView>

            <CollapsibleHeaderBackdrop />

            <CollapsibleHeader>
                {isDefined(leading) ? <CollapsibleHeaderLeading>{leading}</CollapsibleHeaderLeading> : null}
                <CollapsibleHeaderTitleSlot>
                    <CollapsibleHeaderLargeTitle>
                        <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
                            {title}
                        </Text>
                    </CollapsibleHeaderLargeTitle>
                    <CollapsibleHeaderSmallTitle>
                        <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
                            {title}
                        </Text>
                    </CollapsibleHeaderSmallTitle>
                </CollapsibleHeaderTitleSlot>
                {isDefined(trailing) ? <CollapsibleHeaderTrailing>{trailing}</CollapsibleHeaderTrailing> : null}
            </CollapsibleHeader>
        </ScreenChromeFrame>
    </ScreenChromeThemeProvider>
);
