import Animated from 'react-native-reanimated';

import { useMorphingSheetPageRectStyle } from '../../hook/use-morphing-sheet-page-rect-style.hook';

import type { MorphingSheetPageRectInterface } from '../../interface/morphing-sheet-page-rect.interface';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly rect: SharedValue<MorphingSheetPageRectInterface>;
}

export const MorphingSheetPageBackdrop = ({ rect }: Props) => {
    const rectStyle = useMorphingSheetPageRectStyle(rect);

    return <Animated.View className="bg-sheet-surface absolute overflow-hidden" style={rectStyle} pointerEvents="none" />;
};
