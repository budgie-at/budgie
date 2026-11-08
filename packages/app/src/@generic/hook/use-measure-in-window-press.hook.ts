import { useRef } from 'react';

import { useAnchoredMorphOriginOffset } from '../context/anchored-morph-origin-offset.context';

import type { WindowRectInterface } from '../interface/window-rect.interface';
import type { View } from 'react-native';

export const useMeasureInWindowPress = (onPress: (rect: WindowRectInterface) => void) => {
    const ref = useRef<View>(null);
    const offset = useAnchoredMorphOriginOffset();

    const handlePress = () => {
        ref.current?.measureInWindow((x, y, width, height) => {
            onPress({ x, y: y + offset, width, height });
        });
    };

    return { ref, handlePress };
};
