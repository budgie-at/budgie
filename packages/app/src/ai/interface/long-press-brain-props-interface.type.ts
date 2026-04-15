import { SharedValue } from 'react-native-reanimated';

export interface LongPressBrainPropsInterface {
    readonly progress: number;
    readonly size: number;
    readonly iconSize: number;
    readonly isAnimating?: boolean;
    readonly holdProgress: SharedValue<number>;
}
