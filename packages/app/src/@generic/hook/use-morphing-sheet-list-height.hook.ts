import { useWindowDimensions } from 'react-native';

import { useMorphingSheetFrame } from './use-morphing-sheet-frame.hook';

export const useMorphingSheetListHeight = (ratio: number) => {
    const { height: windowHeight } = useWindowDimensions();
    const { baseBottom, frameHeight } = useMorphingSheetFrame();

    return { height: Math.min(windowHeight * ratio, frameHeight - baseBottom) };
};
