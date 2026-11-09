import { use } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { ScreenChromeStickyHeadersContext } from '../../context/screen-chrome-sticky-headers.context';
import { ScreenChromeStickyHeaderRow } from '../screen-chrome-sticky-header-row/screen-chrome-sticky-header-row';
import { StickySectionHeaderBackdrop } from '../sticky-section-header-backdrop/sticky-section-header-backdrop';

import type { ScreenChromeStickyHeaderSourceInterface } from '../../interface/screen-chrome-sticky-header-source.interface';

interface Props {
    readonly source: ScreenChromeStickyHeaderSourceInterface | null;
}

export const ScreenChromeStickyHeaderOverlay = ({ source }: Props) => {
    const context = use(ScreenChromeStickyHeadersContext);
    const state = context?.state;
    const anchor = context?.anchor;

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        top: anchor?.get() ?? 0,
        left: 0,
        right: 0,
        height: state?.get().height ?? 0,
        overflow: 'hidden',
        zIndex: 4
    }));
    const headers = source?.headers ?? [];
    const horizontalInset = source?.horizontalInset ?? 0;

    return (
        <Animated.View
            style={style}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <StickySectionHeaderBackdrop />
            {headers.map((header, position) => (
                <ScreenChromeStickyHeaderRow key={header.index} header={header} position={position} horizontalInset={horizontalInset} />
            ))}
        </Animated.View>
    );
};
