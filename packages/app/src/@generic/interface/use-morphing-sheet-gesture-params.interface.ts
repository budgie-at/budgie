import type { SharedValue } from 'react-native-reanimated';

export interface UseMorphingSheetGestureParamsInterface {
    readonly translateY: SharedValue<number>;
    readonly visibleHeight: SharedValue<number>;
    readonly isEnabled: boolean;
    readonly onDismiss: (velocity: number) => void;
}
