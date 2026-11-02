import { useSharedValue } from 'react-native-reanimated';

import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export const useSheetScrollEdge = () => {
    const scrollOffset = useSharedValue(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffset.set(event.nativeEvent.contentOffset.y);
    };

    return { scrollOffset, handleScroll };
};
