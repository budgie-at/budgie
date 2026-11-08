import type { SharedValue } from 'react-native-reanimated';

export interface UseLockstepStackGestureParamsInterface {
    readonly position: SharedValue<number>;
    readonly topIndex: SharedValue<number>;
    readonly width: number;
    readonly isEnabled: boolean;
    readonly onPopped: (target: number) => void;
}
