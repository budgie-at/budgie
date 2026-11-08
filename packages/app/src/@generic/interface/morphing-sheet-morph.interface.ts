import type { SharedValue } from 'react-native-reanimated';

export interface MorphingSheetMorphInterface {
    readonly pageProgress: SharedValue<number>;
    readonly progress: SharedValue<number>;
    readonly fromStep: SharedValue<string>;
    readonly toStep: SharedValue<string>;
    readonly tallerStep: SharedValue<string>;
    readonly isProgressDriven: SharedValue<boolean>;
}
