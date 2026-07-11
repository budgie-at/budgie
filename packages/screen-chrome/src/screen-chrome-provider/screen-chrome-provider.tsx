import { ReactNode, useMemo } from 'react';
import Animated, {
    scrollTo,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useReducedMotion,
    useScrollViewOffset
} from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { SCREEN_CHROME_DEFAULT_CONFIG } from '../constant/screen-chrome-default-config.constant';
import { ScreenChromeContext } from '../context/screen-chrome.context';
import { ColorSchemeEnum } from '../enum/color-scheme.enum';
import { ScreenChromeConfigInterface, ScreenChromeConfigOverridesInterface } from '../interface/screen-chrome-config.interface';

interface Props {
    readonly children: ReactNode;
    readonly colorScheme?: ColorSchemeEnum;
    readonly config?: ScreenChromeConfigOverridesInterface;
}

const mergeConfig = (overrides: ScreenChromeConfigOverridesInterface | undefined): ScreenChromeConfigInterface => {
    if (!isDefined(overrides)) {
        return SCREEN_CHROME_DEFAULT_CONFIG;
    }

    const colorsOverrides = overrides.colors;
    const maskStopsOverrides = overrides.maskStops;

    return {
        ...SCREEN_CHROME_DEFAULT_CONFIG,
        ...overrides,
        colors: {
            [ColorSchemeEnum.Light]: {
                ...SCREEN_CHROME_DEFAULT_CONFIG.colors[ColorSchemeEnum.Light],
                ...colorsOverrides?.[ColorSchemeEnum.Light]
            },
            [ColorSchemeEnum.Dark]: {
                ...SCREEN_CHROME_DEFAULT_CONFIG.colors[ColorSchemeEnum.Dark],
                ...colorsOverrides?.[ColorSchemeEnum.Dark]
            }
        },
        maskStops: {
            top: { ...SCREEN_CHROME_DEFAULT_CONFIG.maskStops.top, ...maskStopsOverrides?.top },
            bottom: { ...SCREEN_CHROME_DEFAULT_CONFIG.maskStops.bottom, ...maskStopsOverrides?.bottom }
        }
    };
};

const MOMENTUM_VELOCITY_EPSILON = 0.05;

export const ScreenChromeProvider = ({ children, colorScheme = ColorSchemeEnum.Light, config }: Props): ReactNode => {
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const scrollY = useScrollViewOffset(scrollRef);
    const reducedMotion = useReducedMotion();
    const mergedConfig = useMemo(() => mergeConfig(config), [config]);
    const { snapToCollapse, collapseStart, collapseEnd } = mergedConfig;

    const snapIfNeeded = (offsetY: number): void => {
        'worklet';

        if (offsetY <= collapseStart || offsetY >= collapseEnd) {
            return;
        }

        const midpoint = (collapseStart + collapseEnd) / 2;
        const target = offsetY < midpoint ? collapseStart : collapseEnd;

        scrollTo(scrollRef, 0, target, !reducedMotion);
    };

    const scrollHandler = useAnimatedScrollHandler({
        onEndDrag: event => {
            if (!snapToCollapse) {
                return;
            }

            const velocityY = event.velocity?.y;

            if (typeof velocityY === 'number' && Math.abs(velocityY) >= MOMENTUM_VELOCITY_EPSILON) {
                return;
            }

            snapIfNeeded(event.contentOffset.y);
        },
        onMomentumEnd: event => {
            if (!snapToCollapse) {
                return;
            }

            snapIfNeeded(event.contentOffset.y);
        }
    });

    const contextValue = useMemo(
        () => ({ colorScheme, config: mergedConfig, scrollY, scrollHandler, scrollRef }),
        [colorScheme, mergedConfig, scrollY, scrollHandler, scrollRef]
    );

    return <ScreenChromeContext value={contextValue}>{children}</ScreenChromeContext>;
};
