import { Pressable, StyleSheet, View } from 'react-native';
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
        ...StyleSheet.absoluteFill,
        transform: [{ rotateY: '180deg' }]
    }
});

const flipTransition = {
    transitionProperty: 'transform',
    transitionDuration: FLIP_DURATION,
    transitionTimingFunction: 'ease-out'
} as const;

export const AmountSignToggle = ({ isNegative, positiveIcon, negativeIcon, ...pressableProps }: AmountSignTogglePropsInterface) => {
    const rotation = isNegative ? '180deg' : '0deg';
    const flipStyle = [flipTransition, { transform: [{ perspective: FLIP_PERSPECTIVE }, { rotateY: rotation }] }];
    const backFaceStyle = [styles.face, styles.backFace];
    const accessibilityState = { checked: isNegative };

    return (
        <Pressable accessibilityRole="switch" accessibilityState={accessibilityState} {...pressableProps}>
            <Animated.View style={flipStyle}>
                <View style={styles.face}>{positiveIcon}</View>
                <View style={backFaceStyle}>{negativeIcon}</View>
            </Animated.View>
        </Pressable>
    );
};
