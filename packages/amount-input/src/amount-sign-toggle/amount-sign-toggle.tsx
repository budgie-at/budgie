import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { AmountSignTogglePropsInterface } from '../interface/amount-sign-toggle-props.interface';

const FLIP_PERSPECTIVE = 400;
const FLIP_DURATION = 250;

const styles = StyleSheet.create({
    face: {
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden'
    },
    backFace: {
        ...StyleSheet.absoluteFill
    }
});

const flipTransition = {
    transitionProperty: 'transform',
    transitionDuration: FLIP_DURATION,
    transitionTimingFunction: 'ease-out'
} as const;

const getFaceStyle = (rotation: string) => [flipTransition, { transform: [{ perspective: FLIP_PERSPECTIVE }, { rotateY: rotation }] }];

export const AmountSignToggle = ({ isNegative, positiveIcon, negativeIcon, ...pressableProps }: AmountSignTogglePropsInterface) => {
    const frontFaceStyle = [styles.face, ...getFaceStyle(isNegative ? '180deg' : '0deg')];
    const backFaceStyle = [styles.face, styles.backFace, ...getFaceStyle(isNegative ? '0deg' : '-180deg')];
    const accessibilityState = { checked: isNegative };

    return (
        <Pressable accessibilityRole="switch" accessibilityState={accessibilityState} {...pressableProps}>
            <Animated.View style={frontFaceStyle}>{positiveIcon}</Animated.View>
            <Animated.View style={backFaceStyle}>{negativeIcon}</Animated.View>
        </Pressable>
    );
};
