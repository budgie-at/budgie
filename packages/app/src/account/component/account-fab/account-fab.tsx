import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateTransactionTrigger } from '../../../transaction/components/create-transaction-trigger/create-transaction-trigger';

const FAB_ANIMATION_DELAY = 300;
const FAB_SPRING_CONFIG = { damping: 12, stiffness: 180 };

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 16
    }
});

interface Props {
    readonly isMenuOpen: boolean;
    readonly onPress: () => void;
}

export const AccountFab = ({ isMenuOpen, onPress }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(FAB_ANIMATION_DELAY, withSpring(1, FAB_SPRING_CONFIG));
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const containerStyle = [styles.container, { bottom: bottom + 16 }, animatedStyle];

    return (
        <Animated.View style={containerStyle} pointerEvents="box-none">
            <CreateTransactionTrigger isOpen={isMenuOpen} onPress={onPress} />
        </Animated.View>
    );
};
