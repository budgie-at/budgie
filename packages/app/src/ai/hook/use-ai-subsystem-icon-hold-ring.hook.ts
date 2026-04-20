import { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const FULL_OPACITY = 1;
const OPACITY_THRESHOLD = 0.01;
const POSITION_ABSOLUTE = 'absolute' as const;

interface HoldRingParams {
    readonly holdProgress: SharedValue<number>;
    readonly ringCircumference: number;
    readonly ringOffset: number;
}

export const useAiSubsystemIconHoldRing = ({ holdProgress, ringCircumference, ringOffset }: HoldRingParams) => {
    const holdRingStyle = useAnimatedStyle(() => ({
        opacity: holdProgress.get() > OPACITY_THRESHOLD ? FULL_OPACITY : 0,
        position: POSITION_ABSOLUTE,
        top: -ringOffset,
        left: -ringOffset
    }));

    return { holdRingStyle, strokeDashoffset: (progress: number) => ringCircumference * (1 - progress) };
};
