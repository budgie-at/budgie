import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { ACCOUNT_DETAILS_NAV_BALANCE_OFFSET } from '../../../account/constant/account-details-nav-balance-offset.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

const Z_INDEX_STYLE = { zIndex: 4 };

export const CategorizeInboxNavSubtitle = () => {
    const { t } = useLingui();
    const { remainingCount } = useCategorizeInboxContext();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();
    const { fontScale } = useWindowDimensions();

    const subtitleTop = (config.collapsedHeaderHeight ?? config.headerHeight) / 2 + ACCOUNT_DETAILS_NAV_BALANCE_OFFSET * fontScale;
    const fadeRange = [config.smallTitleStart, config.collapseEnd];

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
            >
                {t({ message: plural(remainingCount, { one: '# to sort', other: '# to sort' }) })}
            </Animated.Text>
        </View>
    );
};
