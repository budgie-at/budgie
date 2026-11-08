import type { SharedValue } from 'react-native-reanimated';

export interface MorphingSheetDragInterface {
    readonly translateY: SharedValue<number>;
    readonly visibleHeight: SharedValue<number>;
    readonly isDismissing: SharedValue<boolean>;
    readonly isDragging: SharedValue<boolean>;
    readonly isEnabled: boolean;
    readonly onSwipeDismiss: (velocity: number) => void;
}
