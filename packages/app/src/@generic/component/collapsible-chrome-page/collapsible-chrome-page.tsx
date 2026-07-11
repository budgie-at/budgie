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

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { cn } from '../../utils/cn.util';
import { StickyFooterBand } from '../sticky-footer-band/sticky-footer-band';

type TitleProps =
    | { readonly title: string; readonly largeTitle?: never; readonly smallTitle?: never }
    | { readonly title?: never; readonly largeTitle: ReactNode; readonly smallTitle: ReactNode };

type Props = TitleProps & {
    readonly children: ReactNode;
    readonly leading?: ReactNode;
    readonly trailing?: ReactNode;
    readonly footer?: ReactNode;
    readonly scrollViewProps?: Pick<ComponentProps<typeof ScreenChromeScrollView>, 'ref' | 'onLayout'>;
    readonly contentClassName?: string;
    readonly testID?: string;
};

const FOOTER_CONTENT_BOTTOM_INSET = 96;

export const CollapsibleChromePage = ({
    title,
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
    const resolvedLargeTitle = largeTitle ?? (
        <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
            {title}
        </Text>
    );
    const resolvedSmallTitle = smallTitle ?? (
        <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
            {title}
        </Text>
    );

    return (
        <ScreenChromeThemeProvider>
            <ScreenChromeFrame>
                <ScreenChromeScrollView
                    {...scrollViewProps}
                    contentInsetTop={SCREEN_CHROME_CONTENT_INSET_TOP}
                    contentInsetBottom={contentInsetBottom}
                    showsVerticalScrollIndicator={false}
                    testID={testID}
                >
                    <View className={cn('px-5xl', contentClassName)}>{children}</View>
                </ScreenChromeScrollView>

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
