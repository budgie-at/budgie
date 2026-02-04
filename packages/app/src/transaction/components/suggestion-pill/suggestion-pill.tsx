import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly index: number;
    readonly animationDuration: number;
    readonly staggerDelay: number;
    readonly maxWidth?: string;
    readonly children: ReactNode;
    readonly onPress: () => void;
}

const styles = StyleSheet.create({
    pill: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2
    }
});

export const SuggestionPill = (props: Props) => {
    const { index, animationDuration, staggerDelay, maxWidth = 'max-w-44', children, onPress } = props;

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration).delay(index * staggerDelay)}
            layout={LinearTransition.duration(animationDuration)}
        >
            <HapticPressable
                className={`flex-row items-center gap-xs px-sm py-xs bg-ghost-background rounded-xl ${maxWidth}`}
                style={styles.pill}
                onPress={onPress}
            >
                {children}
            </HapticPressable>
        </Animated.View>
    );
};
