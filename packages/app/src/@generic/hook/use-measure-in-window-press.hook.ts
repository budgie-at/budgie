import { useRef } from 'react';

import type { WindowRectInterface } from '../interface/window-rect.interface';
import type { View } from 'react-native';

export const useMeasureInWindowPress = (onPress: (rect: WindowRectInterface) => void) => {
    const ref = useRef<View>(null);

    const handlePress = () => {
        ref.current?.measureInWindow((x, y, width, height) => {
            onPress({ x, y, width, height });
        });
    };

    return { ref, handlePress };
};
