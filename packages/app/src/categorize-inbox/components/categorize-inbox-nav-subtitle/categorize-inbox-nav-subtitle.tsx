import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { use, useEffect, useEffectEvent } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_TITLE_CLEARANCE } from '../../../@generic/constant/screen-chrome-config.constant';
import { ScreenChromeStickyHeadersContext } from '../../../@generic/context/screen-chrome-sticky-headers.context';
import { ACCOUNT_DETAILS_NAV_BALANCE_OFFSET } from '../../../account/constant/account-details-nav-balance-offset.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import type { LayoutChangeEvent } from 'react-native';

const Z_INDEX_STYLE = { zIndex: 4 };

export const CategorizeInboxNavSubtitle = () => {
    const { t } = useLingui();
    const { remainingCount } = useCategorizeInboxContext();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();
    const { fontScale } = useWindowDimensions();
    const { top } = useSafeAreaInsets();
    const stickyContext = use(ScreenChromeStickyHeadersContext);

    const subtitleTop = (config.collapsedHeaderHeight ?? config.headerHeight) / 2 + ACCOUNT_DETAILS_NAV_BALANCE_OFFSET * fontScale;
    const fadeRange = [config.smallTitleStart, config.collapseEnd];
    const handleLayout = (event: LayoutChangeEvent) =>
        stickyContext?.protectedBottom.set(top + subtitleTop + event.nativeEvent.layout.height + SCREEN_CHROME_TITLE_CLEARANCE);
    const handleUnmount = useEffectEvent(() => stickyContext?.protectedBottom.set(0));
    useEffect(() => () => handleUnmount(), []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), fadeRange, [0, 1], Extrapolation.CLAMP),
        transform: [{ translateY: subtitleTop }]
    }));

    return (
        <View className="absolute inset-x-0 top-0 pt-safe px-[72px]" style={Z_INDEX_STYLE} pointerEvents="none">
            <Animated.Text
                className="text-secondary-foreground text-[15px] leading-[18px] text-center tabular-nums"
                numberOfLines={1}
                style={animatedStyle}
                onLayout={handleLayout}
            >
                {t({ message: plural(remainingCount, { one: '# to sort', other: '# to sort' }) })}
            </Animated.Text>
        </View>
    );
};
