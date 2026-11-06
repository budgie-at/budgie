import { use, useState } from 'react';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { ScreenChromeStickyHeadersContext } from '../../context/screen-chrome-sticky-headers.context';
import { ScreenChromeStickyHeaderRow } from '../screen-chrome-sticky-header-row/screen-chrome-sticky-header-row';

import type { ScreenChromeStickyHeaderSourceInterface } from '../../interface/screen-chrome-sticky-header-source.interface';

interface Props {
    readonly source: ScreenChromeStickyHeaderSourceInterface | null;
}

export const ScreenChromeStickyHeaderOverlay = ({ source }: Props) => {
    const context = use(ScreenChromeStickyHeadersContext);
    const [renderIndex, setRenderIndex] = useState(0);
    const { config, colorScheme } = useScreenChrome();
    const { solid } = config.colors[colorScheme];
    const state = context?.state;
    const anchor = context?.anchor;

    useAnimatedReaction(
        () => Math.max(0, state?.get().index ?? -1),
        (index, previous) => {
            if (index !== previous) {
                runOnJS(setRenderIndex)(index);
            }
        }
    );
    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        top: anchor?.get() ?? 0,
        left: 0,
        right: 0,
        height: state?.get().height ?? 0,
        overflow: 'hidden',
        zIndex: 4,
        backgroundColor: solid
    }));
    const start = Math.max(0, renderIndex - 1);
    const headers = source?.headers.slice(start, renderIndex + 2).map((header, index) => ({ header, position: start + index })) ?? [];
    const horizontalInset = source?.horizontalInset ?? 0;

    return (
        <Animated.View
            style={style}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {headers.map(({ header, position }) => (
                <ScreenChromeStickyHeaderRow key={header.index} header={header} position={position} horizontalInset={horizontalInset} />
            ))}
        </Animated.View>
    );
};
